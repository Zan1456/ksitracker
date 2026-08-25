import { cache } from "react";
import { and, asc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { taskResults, workoutTasks, users, workoutSessions } from "@/db/schema";

export type LeaderboardScope = "week" | "alltime";

export type LeaderboardCategory = {
  name: string;
  rankDirection: "asc" | "desc";
  resultKind: "time" | "reps";
};

export type LeaderboardRow = {
  userId: string;
  userName: string;
  value: number; // ms for "time" categories, rep count for "reps" categories
  rank: number;
};

/**
 * `getLeaderboard` and `getPersonalTrend` both look this up internally, and
 * the leaderboard page also calls it directly — `cache()` collapses all of
 * those into a single query per request instead of one each.
 */
export const getLeaderboardCategories = cache(async (): Promise<LeaderboardCategory[]> => {
  const rows = await db
    .select({
      name: workoutTasks.name,
      rankDirection: workoutTasks.rankDirection,
      resultKind: workoutTasks.resultKind,
    })
    .from(workoutTasks)
    .where(eq(workoutTasks.type, "stopwatch"));

  const byName = new Map<string, LeaderboardCategory>();
  for (const r of rows) {
    if (!r.rankDirection || !r.resultKind) continue;
    if (!byName.has(r.name)) {
      byName.set(r.name, { name: r.name, rankDirection: r.rankDirection, resultKind: r.resultKind });
    }
  }
  return Array.from(byName.values());
});

function mondayOfCurrentWeekIso(): string {
  const now = new Date();
  const jsDay = now.getUTCDay(); // 0 = sunday
  const offset = (jsDay + 6) % 7;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - offset);
  return monday.toISOString().slice(0, 10);
}

export async function getLeaderboard(
  categoryName: string,
  scope: LeaderboardScope = "alltime"
): Promise<{
  category: LeaderboardCategory | null;
  rows: LeaderboardRow[];
}> {
  const categories = await getLeaderboardCategories();
  const category = categories.find((c) => c.name === categoryName) ?? null;
  if (!category) return { category: null, rows: [] };

  const results = await db
    .select({
      userId: users.id,
      userName: users.name,
      resultMs: taskResults.resultMs,
      resultReps: taskResults.resultReps,
    })
    .from(taskResults)
    .innerJoin(workoutTasks, eq(taskResults.taskId, workoutTasks.id))
    .innerJoin(workoutSessions, eq(taskResults.sessionId, workoutSessions.id))
    .innerJoin(users, eq(workoutSessions.userId, users.id))
    .where(
      and(
        eq(workoutTasks.name, categoryName),
        eq(workoutTasks.type, "stopwatch"),
        eq(taskResults.completed, true),
        scope === "week" ? gte(workoutSessions.sessionDate, mondayOfCurrentWeekIso()) : undefined
      )
    );

  const bestByUser = new Map<string, { userName: string; value: number }>();
  for (const r of results) {
    const value = category.resultKind === "time" ? r.resultMs : r.resultReps;
    if (value === null || value === undefined) continue;

    const existing = bestByUser.get(r.userId);
    const better =
      !existing ||
      (category.rankDirection === "asc" ? value < existing.value : value > existing.value);
    if (better) {
      bestByUser.set(r.userId, { userName: r.userName, value });
    }
  }

  const sorted = Array.from(bestByUser.entries())
    .map(([userId, v]) => ({ userId, userName: v.userName, value: v.value }))
    .sort((a, b) => (category.rankDirection === "asc" ? a.value - b.value : b.value - a.value));

  const rows: LeaderboardRow[] = sorted.map((r, i) => ({ ...r, rank: i + 1 }));

  return { category, rows };
}

export type TrendPoint = { value: number; date: string };

/** The user's last `limit` recorded results for a category, oldest first (for a trend chart). */
export async function getPersonalTrend(
  userId: string,
  categoryName: string,
  limit = 5
): Promise<{ category: LeaderboardCategory | null; points: TrendPoint[] }> {
  const categories = await getLeaderboardCategories();
  const category = categories.find((c) => c.name === categoryName) ?? null;
  if (!category) return { category: null, points: [] };

  const results = await db
    .select({
      resultMs: taskResults.resultMs,
      resultReps: taskResults.resultReps,
      completedAt: taskResults.completedAt,
      sessionDate: workoutSessions.sessionDate,
    })
    .from(taskResults)
    .innerJoin(workoutTasks, eq(taskResults.taskId, workoutTasks.id))
    .innerJoin(workoutSessions, eq(taskResults.sessionId, workoutSessions.id))
    .where(
      and(
        eq(workoutSessions.userId, userId),
        eq(workoutTasks.name, categoryName),
        eq(workoutTasks.type, "stopwatch"),
        eq(taskResults.completed, true)
      )
    )
    .orderBy(asc(taskResults.completedAt));

  const points: TrendPoint[] = results
    .map((r) => ({
      value: category.resultKind === "time" ? r.resultMs : r.resultReps,
      date: r.sessionDate,
    }))
    .filter((p): p is TrendPoint => p.value !== null && p.value !== undefined)
    .slice(-limit);

  return { category, points };
}
