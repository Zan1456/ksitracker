import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { users, workoutSessions, workouts, levels } from "@/db/schema";
import { getLevelsWithProgress } from "./workout-data";
import { getLeaderboardCategories, getLeaderboard } from "./leaderboard";
import { isoDaysAgo, todayIso } from "./format";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  isBanned: boolean;
  doneCount: number;
  totalCount: number;
  lastActiveDate: string | null;
  daysInactive: number | null;
};

const INACTIVE_THRESHOLD_DAYS = 14;

export async function getAdminUserList(): Promise<AdminUserRow[]> {
  const allUsers = await db.select().from(users).where(ne(users.role, "admin"));
  const totalWorkoutsCount = await db.select().from(workouts);
  const total = totalWorkoutsCount.length;

  const allCompleted = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.status, "completed"));

  const today = todayIso();

  return allUsers.map((u) => {
    const mine = allCompleted.filter((s) => s.userId === u.id);
    const doneWorkoutIds = new Set(mine.map((s) => s.workoutId));
    const lastActiveDate = mine.reduce<string | null>(
      (max, s) => (max === null || s.sessionDate > max ? s.sessionDate : max),
      null
    );
    const daysInactive = lastActiveDate
      ? Math.round(
          (new Date(today).getTime() - new Date(lastActiveDate).getTime()) / 86_400_000
        )
      : null;

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      isBanned: u.isBanned,
      doneCount: doneWorkoutIds.size,
      totalCount: total,
      lastActiveDate,
      daysInactive,
    };
  });
}

export function isInactive(row: Pick<AdminUserRow, "daysInactive">) {
  return row.daysInactive === null || row.daysInactive >= INACTIVE_THRESHOLD_DAYS;
}

export async function getAdminUserDetail(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const [levelsProgress, allUserRows, categories] = await Promise.all([
    getLevelsWithProgress(userId),
    getAdminUserList(),
    getLeaderboardCategories(),
  ]);

  const doneCount = levelsProgress.reduce((s, l) => s + l.doneCount, 0);
  const totalCount = levelsProgress.reduce((s, l) => s + l.totalCount, 0);

  const ranked = [...allUserRows].sort((a, b) => b.doneCount - a.doneCount);
  const rank = ranked.findIndex((r) => r.id === userId) + 1;

  const bestTimes = await Promise.all(
    categories.map(async (c) => {
      const { rows } = await getLeaderboard(c.name);
      const mine = rows.find((r) => r.userId === userId);
      return { category: c, row: mine ?? null };
    })
  );

  const recentSessions = await db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.status, "completed")))
    .orderBy(desc(workoutSessions.completedAt));

  const streakDays = (() => {
    const days = new Set(recentSessions.map((s) => s.sessionDate));
    let streak = 0;
    const cursor = new Date();
    for (;;) {
      const iso = cursor.toISOString().slice(0, 10);
      if (days.has(iso)) {
        streak++;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      } else if (streak === 0 && iso === todayIso()) {
        cursor.setUTCDate(cursor.getUTCDate() - 1);
        continue;
      } else break;
    }
    return streak;
  })();

  return {
    user,
    levelsProgress,
    doneCount,
    totalCount,
    rank,
    totalUsers: allUserRows.length,
    bestTimes,
    streakDays,
    hasBonusToday: user.dailyBonusDate === todayIso(),
  };
}

export async function getAppStats() {
  const allUsers = await db.select().from(users).where(ne(users.role, "admin"));
  const completed = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.status, "completed"));
  const allWorkouts = await db.select().from(workouts);
  const allLevels = await db.select().from(levels);

  const today = todayIso();
  const last7 = isoDaysAgo(7);
  const activeLast7 = new Set(
    completed.filter((s) => s.sessionDate >= last7).map((s) => s.userId)
  ).size;
  const completedToday = completed.filter((s) => s.sessionDate === today).length;
  const totalSeconds = completed.reduce((sum, s) => sum + (s.totalSeconds ?? 0), 0);

  return {
    totalUsers: allUsers.length,
    totalWorkouts: allWorkouts.length,
    totalLevels: allLevels.length,
    totalCompletedSessions: completed.length,
    activeLast7,
    completedToday,
    totalHours: Math.round(totalSeconds / 3600),
  };
}
