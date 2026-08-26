import { cache } from "react";
import { and, asc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { challengeTasks, challengeTaskResults, challengeSessions, users } from "@/db/schema";

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
 *
 * Every challenge task is its own leaderboard category (the challenge list
 * is global, so there's no per-workout duplication to dedupe anymore).
 */
export const getLeaderboardCategories = cache(async (): Promise<LeaderboardCategory[]> => {
  return db
    .select({
      name: challengeTasks.name,
      rankDirection: challengeTasks.rankDirection,
      resultKind: challengeTasks.resultKind,
    })
    .from(challengeTasks)
    .orderBy(asc(challengeTasks.order));
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
      resultMs: challengeTaskResults.resultMs,
      resultReps: challengeTaskResults.resultReps,
    })
    .from(challengeTaskResults)
    .innerJoin(challengeTasks, eq(challengeTaskResults.taskId, challengeTasks.id))
    .innerJoin(challengeSessions, eq(challengeTaskResults.sessionId, challengeSessions.id))
    .innerJoin(users, eq(challengeSessions.userId, users.id))
    .where(
      and(
        eq(challengeTasks.name, categoryName),
        eq(challengeTaskResults.completed, true),
        scope === "week" ? gte(challengeSessions.sessionDate, mondayOfCurrentWeekIso()) : undefined
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
      resultMs: challengeTaskResults.resultMs,
      resultReps: challengeTaskResults.resultReps,
      completedAt: challengeTaskResults.completedAt,
      sessionDate: challengeSessions.sessionDate,
    })
    .from(challengeTaskResults)
    .innerJoin(challengeTasks, eq(challengeTaskResults.taskId, challengeTasks.id))
    .innerJoin(challengeSessions, eq(challengeTaskResults.sessionId, challengeSessions.id))
    .where(
      and(
        eq(challengeSessions.userId, userId),
        eq(challengeTasks.name, categoryName),
        eq(challengeTaskResults.completed, true)
      )
    )
    .orderBy(asc(challengeTaskResults.completedAt));

  const points: TrendPoint[] = results
    .map((r) => ({
      value: category.resultKind === "time" ? r.resultMs : r.resultReps,
      date: r.sessionDate,
    }))
    .filter((p): p is TrendPoint => p.value !== null && p.value !== undefined)
    .slice(-limit);

  return { category, points };
}
