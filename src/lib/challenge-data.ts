import { and, asc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { challengeTasks, challengeSettings, challengeSessions, workoutTasks, workouts, levels } from "@/db/schema";
import { todayIso } from "./format";

export type ChallengeTaskDTO = typeof challengeTasks.$inferSelect;

/** The global, level-agnostic list of challenge tasks, in display order. */
export async function getChallengeTasks(): Promise<ChallengeTaskDTO[]> {
  return db.select().from(challengeTasks).orderBy(asc(challengeTasks.order));
}

export type LiftableWorkoutTask = {
  id: string;
  name: string;
  note: string | null;
  type: "reps" | "time" | "stopwatch";
  targetDistanceMeters: number | null;
  resultKind: "time" | "reps" | null;
  rankDirection: "asc" | "desc" | null;
  workoutName: string;
  levelIndex: number;
  levelName: string;
};

/**
 * Every workout task an admin could "lift" into the global challenge list
 * (everything except "rest" tasks, which have no result to rank). Used by
 * the admin challenge editor to prefill a new challenge task from an
 * existing training-plan exercise instead of typing it from scratch.
 */
export async function getLiftableWorkoutTasks(): Promise<LiftableWorkoutTask[]> {
  const rows = await db
    .select({
      id: workoutTasks.id,
      name: workoutTasks.name,
      note: workoutTasks.note,
      type: workoutTasks.type,
      targetDistanceMeters: workoutTasks.targetDistanceMeters,
      resultKind: workoutTasks.resultKind,
      rankDirection: workoutTasks.rankDirection,
      workoutName: workouts.name,
      levelIndex: levels.index,
      levelName: levels.name,
    })
    .from(workoutTasks)
    .innerJoin(workouts, eq(workoutTasks.workoutId, workouts.id))
    .innerJoin(levels, eq(workouts.levelId, levels.id))
    .where(ne(workoutTasks.type, "rest"))
    .orderBy(asc(levels.order), asc(workouts.order), asc(workoutTasks.order));
  return rows as LiftableWorkoutTask[];
}

/**
 * Single-row config (how many of the challenge tasks must be completed to
 * pass). Creates the row with a default on first read so callers never have
 * to handle a missing config.
 */
export async function getOrCreateChallengeSettings() {
  const [existing] = await db.select().from(challengeSettings).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(challengeSettings).values({ minRequired: 1 }).returning();
  return created;
}

/** Levels for which this user has ever passed the challenge (used to gate progression). */
export async function getPassedChallengeLevelIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ levelId: challengeSessions.levelId })
    .from(challengeSessions)
    .where(
      and(
        eq(challengeSessions.userId, userId),
        eq(challengeSessions.status, "completed"),
        eq(challengeSessions.passed, true)
      )
    );
  return new Set(rows.map((r) => r.levelId));
}

export type ChallengeDailyLimitInfo = {
  canStartNew: boolean;
  usedToday: number;
  limitToday: number;
  reason?: "already_in_progress" | "limit_reached";
  inProgressSessionId?: string;
  inProgressLevelId?: string;
};

/**
 * The challenge has its own daily 1× limit, entirely separate from the
 * regular workouts' daily limit — attempting it doesn't touch or consume
 * that limit, and vice versa.
 */
export async function getChallengeDailyLimitInfo(userId: string): Promise<ChallengeDailyLimitInfo> {
  const today = todayIso();
  const limitToday = 1;

  const todaysSessions = await db
    .select()
    .from(challengeSessions)
    .where(and(eq(challengeSessions.userId, userId), eq(challengeSessions.sessionDate, today)));

  const inProgress = todaysSessions.find((s) => s.status === "in_progress");
  if (inProgress) {
    return {
      canStartNew: false,
      usedToday: 0,
      limitToday,
      reason: "already_in_progress",
      inProgressSessionId: inProgress.id,
      inProgressLevelId: inProgress.levelId,
    };
  }

  const completedToday = todaysSessions.filter((s) => s.status === "completed").length;
  if (completedToday >= limitToday) {
    return { canStartNew: false, usedToday: completedToday, limitToday, reason: "limit_reached" };
  }

  return { canStartNew: true, usedToday: completedToday, limitToday };
}
