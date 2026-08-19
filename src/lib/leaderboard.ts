import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { taskResults, workoutTasks, users, workoutSessions } from "@/db/schema";

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

export async function getLeaderboardCategories(): Promise<LeaderboardCategory[]> {
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
}

export async function getLeaderboard(categoryName: string): Promise<{
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
        eq(taskResults.completed, true)
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
