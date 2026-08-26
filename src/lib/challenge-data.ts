import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { challengeTasks, challengeSettings, challengeSessions } from "@/db/schema";
import { todayIso } from "./format";

export type ChallengeTaskDTO = typeof challengeTasks.$inferSelect;

/** The global, level-agnostic list of challenge tasks, in display order. */
export async function getChallengeTasks(): Promise<ChallengeTaskDTO[]> {
  return db.select().from(challengeTasks).orderBy(asc(challengeTasks.order));
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
