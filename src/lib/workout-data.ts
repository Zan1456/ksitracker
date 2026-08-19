import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { levels, workouts, workoutTasks, workoutSessions, users } from "@/db/schema";
import { todayIso } from "./format";

export type TaskDTO = typeof workoutTasks.$inferSelect;
export type WorkoutDTO = typeof workouts.$inferSelect;
export type LevelDTO = typeof levels.$inferSelect;

export type WorkoutWithStatus = WorkoutDTO & {
  done: boolean;
  bestSeconds: number | null;
  lastCompletedAt: string | null;
};

export type LevelWithProgress = LevelDTO & {
  workouts: WorkoutWithStatus[];
  doneCount: number;
  totalCount: number;
  locked: boolean;
};

/** All completed sessions for a user, most recent first. */
async function getCompletedSessions(userId: string) {
  return db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.status, "completed")))
    .orderBy(asc(workoutSessions.completedAt));
}

export async function getLevelsWithProgress(userId: string): Promise<LevelWithProgress[]> {
  const allLevels = await db.select().from(levels).orderBy(asc(levels.order));
  const allWorkouts = await db.select().from(workouts).orderBy(asc(workouts.order));
  const completed = await getCompletedSessions(userId);

  const bestByWorkout = new Map<string, { seconds: number | null; completedAt: string | null }>();
  for (const s of completed) {
    const existing = bestByWorkout.get(s.workoutId);
    const completedAt = s.completedAt?.toISOString() ?? null;
    if (!existing) {
      bestByWorkout.set(s.workoutId, { seconds: s.totalSeconds, completedAt });
    } else if (completedAt && (!existing.completedAt || completedAt > existing.completedAt)) {
      bestByWorkout.set(s.workoutId, { seconds: s.totalSeconds, completedAt });
    }
  }

  const result: LevelWithProgress[] = [];
  let previousLevelDone = true;

  for (const level of allLevels) {
    const levelWorkouts = allWorkouts.filter((w) => w.levelId === level.id);
    const withStatus: WorkoutWithStatus[] = levelWorkouts.map((w) => {
      const best = bestByWorkout.get(w.id);
      return {
        ...w,
        done: !!best,
        bestSeconds: best?.seconds ?? null,
        lastCompletedAt: best?.completedAt ?? null,
      };
    });
    const doneCount = withStatus.filter((w) => w.done).length;

    result.push({
      ...level,
      workouts: withStatus,
      doneCount,
      totalCount: withStatus.length,
      locked: !previousLevelDone,
    });

    previousLevelDone = doneCount === withStatus.length && withStatus.length > 0;
  }

  return result;
}

export async function getWorkoutWithTasks(workoutId: string) {
  const [workout] = await db.select().from(workouts).where(eq(workouts.id, workoutId)).limit(1);
  if (!workout) return null;
  const tasks = await db
    .select()
    .from(workoutTasks)
    .where(eq(workoutTasks.workoutId, workoutId))
    .orderBy(asc(workoutTasks.order));
  const [level] = await db.select().from(levels).where(eq(levels.id, workout.levelId)).limit(1);
  return { workout, tasks, level };
}

export type DailyLimitInfo = {
  /** Whether a brand-new workout session may be started right now. */
  canStartNew: boolean;
  usedToday: number;
  limitToday: number;
  reason?: "already_in_progress" | "limit_reached";
  inProgressSessionId?: string;
  inProgressWorkoutId?: string;
};

export async function getDailyLimitInfo(userId: string): Promise<DailyLimitInfo> {
  const today = todayIso();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const bonus = user?.dailyBonusDate === today ? 1 : 0;
  const limitToday = 1 + bonus;

  const todaysSessions = await db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.sessionDate, today)));

  const inProgress = todaysSessions.find((s) => s.status === "in_progress");
  if (inProgress) {
    return {
      canStartNew: false,
      usedToday: 0,
      limitToday,
      reason: "already_in_progress",
      inProgressSessionId: inProgress.id,
      inProgressWorkoutId: inProgress.workoutId,
    };
  }

  const completedToday = todaysSessions.filter((s) => s.status === "completed").length;
  if (completedToday >= limitToday) {
    return { canStartNew: false, usedToday: completedToday, limitToday, reason: "limit_reached" };
  }

  return { canStartNew: true, usedToday: completedToday, limitToday };
}

export async function getStreakDays(userId: string): Promise<number> {
  const completed = await getCompletedSessions(userId);
  const days = new Set(completed.map((s) => s.sessionDate));
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const iso = cursor.toISOString().slice(0, 10);
    if (days.has(iso)) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else if (streak === 0 && iso === todayIso()) {
      // today not done yet, doesn't break the streak — check yesterday next
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      continue;
    } else {
      break;
    }
  }
  return streak;
}

export async function getWeekStrip(userId: string) {
  const completed = await getCompletedSessions(userId);
  const days = new Set(completed.map((s) => s.sessionDate));

  const now = new Date();
  const jsDay = now.getUTCDay(); // 0 sunday
  const mondayOffset = (jsDay + 6) % 7;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - mondayOffset);

  const today = todayIso();
  const week: { iso: string; done: boolean; isToday: boolean; isFuture: boolean }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);
    week.push({ iso, done: days.has(iso), isToday: iso === today, isFuture: iso > today });
  }
  return week;
}

export async function getTotalStats(userId: string) {
  const completed = await getCompletedSessions(userId);
  const totalWorkouts = completed.length;
  const totalSeconds = completed.reduce((sum, s) => sum + (s.totalSeconds ?? 0), 0);
  return { totalWorkouts, totalSeconds };
}

export type WorkoutAccess = {
  level: LevelWithProgress;
  workout: WorkoutWithStatus;
  locked: boolean; // level locked, or an earlier workout in the level isn't done yet
  done: boolean;
};

export async function getWorkoutAccess(userId: string, workoutId: string): Promise<WorkoutAccess | null> {
  const allLevels = await getLevelsWithProgress(userId);
  for (const level of allLevels) {
    const index = level.workouts.findIndex((w) => w.id === workoutId);
    if (index === -1) continue;
    const workout = level.workouts[index];
    const earlierUndone = level.workouts.slice(0, index).some((w) => !w.done);
    return {
      level,
      workout,
      locked: level.locked || (earlierUndone && !workout.done),
      done: workout.done,
    };
  }
  return null;
}

export type HistoryEntry = {
  sessionId: string;
  workoutName: string;
  levelIndex: number;
  levelName: string;
  sessionDate: string;
  totalSeconds: number | null;
};

export async function getHistory(userId: string, limit = 20): Promise<HistoryEntry[]> {
  const rows = await db
    .select({
      sessionId: workoutSessions.id,
      workoutName: workouts.name,
      levelIndex: levels.index,
      levelName: levels.name,
      sessionDate: workoutSessions.sessionDate,
      totalSeconds: workoutSessions.totalSeconds,
    })
    .from(workoutSessions)
    .innerJoin(workouts, eq(workoutSessions.workoutId, workouts.id))
    .innerJoin(levels, eq(workouts.levelId, levels.id))
    .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.status, "completed")))
    .orderBy(desc(workoutSessions.completedAt))
    .limit(limit);
  return rows;
}

/** Boolean done/not-done for the last `days` calendar days, oldest first. */
export async function getActivityGrid(userId: string, days = 28) {
  const completed = await getCompletedSessions(userId);
  const doneDays = new Set(completed.map((s) => s.sessionDate));
  const today = todayIso();

  const grid: { iso: string; done: boolean; isToday: boolean }[] = [];
  const cursor = new Date();
  cursor.setUTCDate(cursor.getUTCDate() - (days - 1));
  for (let i = 0; i < days; i++) {
    const iso = cursor.toISOString().slice(0, 10);
    grid.push({ iso, done: doneDays.has(iso), isToday: iso === today });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return grid;
}

export async function getWorkoutsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  return db.select().from(workouts).where(inArray(workouts.id, ids));
}
