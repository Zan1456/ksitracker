"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { challengeSessions, challengeTaskResults } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import { getChallengeDailyLimitInfo, getChallengeTasks, getOrCreateChallengeSettings } from "@/lib/challenge-data";
import { getLevelsWithProgress } from "@/lib/workout-data";
import { todayIso } from "@/lib/format";

export async function startChallengeSessionAction(levelId: string, selectedTaskIds: string[]) {
  const user = await requireUser();

  const limit = await getChallengeDailyLimitInfo(user.id);
  if (limit.reason === "already_in_progress" && limit.inProgressSessionId) {
    const [existing] = await db
      .select()
      .from(challengeSessions)
      .where(eq(challengeSessions.id, limit.inProgressSessionId))
      .limit(1);
    if (existing) redirect(`/challenge/${existing.levelId}/live`);
  }

  if (!limit.canStartNew) {
    redirect(`/challenge/${levelId}`);
  }

  const levels = await getLevelsWithProgress(user.id);
  const level = levels.find((l) => l.id === levelId);
  const workoutsDone = !!level && level.totalCount > 0 && level.doneCount === level.totalCount;
  if (!level || level.locked || !workoutsDone) redirect("/");

  // Re-validate the selection server-side: keep only real task ids, in the
  // list's canonical order, and require at least `minRequired` of them.
  const [allTasks, settings] = await Promise.all([getChallengeTasks(), getOrCreateChallengeSettings()]);
  const selected = new Set(selectedTaskIds);
  const orderedSelectedIds = allTasks.filter((t) => selected.has(t.id)).map((t) => t.id);
  if (orderedSelectedIds.length < settings.minRequired) {
    redirect(`/challenge/${levelId}?error=selection`);
  }

  const [session] = await db
    .insert(challengeSessions)
    .values({
      userId: user.id,
      levelId,
      status: "in_progress",
      sessionDate: todayIso(),
      selectedTaskIds: orderedSelectedIds,
    })
    .returning();

  redirect(`/challenge/${levelId}/live?session=${session.id}`);
}

export async function completeChallengeTaskAction(input: {
  sessionId: string;
  taskId: string;
  resultMs?: number;
  resultReps?: number;
}) {
  const user = await requireUser();
  const [session] = await db
    .select()
    .from(challengeSessions)
    .where(and(eq(challengeSessions.id, input.sessionId), eq(challengeSessions.userId, user.id)))
    .limit(1);
  if (!session || session.status !== "in_progress") return;

  await db
    .insert(challengeTaskResults)
    .values({
      sessionId: input.sessionId,
      taskId: input.taskId,
      completed: true,
      resultMs: input.resultMs,
      resultReps: input.resultReps,
      completedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [challengeTaskResults.sessionId, challengeTaskResults.taskId],
      set: {
        completed: true,
        resultMs: input.resultMs,
        resultReps: input.resultReps,
        completedAt: new Date(),
      },
    });

  revalidatePath(`/challenge/${session.levelId}/live`);
}

export async function completeChallengeSessionAction(sessionId: string) {
  const user = await requireUser();
  const [session] = await db
    .select()
    .from(challengeSessions)
    .where(and(eq(challengeSessions.id, sessionId), eq(challengeSessions.userId, user.id)))
    .limit(1);
  if (!session || session.status !== "in_progress") redirect("/");

  const results = await db
    .select()
    .from(challengeTaskResults)
    .where(eq(challengeTaskResults.sessionId, sessionId));
  const completedCount = results.filter((r) => r.completed).length;

  const settings = await getOrCreateChallengeSettings();
  const passed = completedCount >= settings.minRequired;

  const totalSeconds = Math.max(
    1,
    Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000)
  );

  await db
    .update(challengeSessions)
    .set({ status: "completed", completedAt: new Date(), totalSeconds, passed })
    .where(eq(challengeSessions.id, sessionId));

  revalidatePath("/");
  redirect(`/challenge/${session.levelId}/done`);
}

export async function abandonChallengeSessionAction(sessionId: string) {
  const user = await requireUser();
  const [session] = await db
    .select()
    .from(challengeSessions)
    .where(and(eq(challengeSessions.id, sessionId), eq(challengeSessions.userId, user.id)))
    .limit(1);
  if (!session) redirect("/");

  await db
    .update(challengeSessions)
    .set({ status: "abandoned", completedAt: new Date() })
    .where(eq(challengeSessions.id, sessionId));

  revalidatePath("/");
  redirect("/");
}
