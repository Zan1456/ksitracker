"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { workoutSessions, taskResults, workoutTasks } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import { getDailyLimitInfo, getWorkoutWithTasks } from "@/lib/workout-data";
import { todayIso } from "@/lib/format";

export async function startSessionAction(workoutId: string) {
  const user = await requireUser();

  const limit = await getDailyLimitInfo(user.id);
  if (limit.reason === "already_in_progress" && limit.inProgressSessionId) {
    const [existing] = await db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.id, limit.inProgressSessionId))
      .limit(1);
    if (existing) {
      redirect(`/workout/${existing.workoutId}/live`);
    }
  }

  if (!limit.canStartNew) {
    redirect(`/workout/${workoutId}?limit=1`);
  }

  const data = await getWorkoutWithTasks(workoutId);
  if (!data) redirect("/");

  const [session] = await db
    .insert(workoutSessions)
    .values({
      userId: user.id,
      workoutId,
      status: "in_progress",
      sessionDate: todayIso(),
    })
    .returning();

  redirect(`/workout/${session.workoutId}/live?session=${session.id}`);
}

export async function completeTaskAction(input: {
  sessionId: string;
  taskId: string;
  resultMs?: number;
  resultReps?: number;
}) {
  const user = await requireUser();
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.id, input.sessionId), eq(workoutSessions.userId, user.id)))
    .limit(1);
  if (!session || session.status !== "in_progress") return;

  await db
    .insert(taskResults)
    .values({
      sessionId: input.sessionId,
      taskId: input.taskId,
      completed: true,
      resultMs: input.resultMs,
      resultReps: input.resultReps,
      completedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [taskResults.sessionId, taskResults.taskId],
      set: {
        completed: true,
        resultMs: input.resultMs,
        resultReps: input.resultReps,
        completedAt: new Date(),
      },
    });

  revalidatePath(`/workout/${session.workoutId}/live`);
}

export async function completeSessionAction(sessionId: string) {
  const user = await requireUser();
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, user.id)))
    .limit(1);
  if (!session || session.status !== "in_progress") redirect("/");

  const wallClockSeconds = Math.max(
    1,
    Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000)
  );

  // Stopwatch tasks are leaderboard-eligible "challenges" embedded in the
  // workout (see workoutTasks.type) — their own time is tracked separately
  // via taskResults.resultMs, so it shouldn't also count toward the
  // workout's total duration.
  const challengeTaskResults = await db
    .select({ resultMs: taskResults.resultMs })
    .from(taskResults)
    .innerJoin(workoutTasks, eq(taskResults.taskId, workoutTasks.id))
    .where(and(eq(taskResults.sessionId, sessionId), eq(workoutTasks.type, "stopwatch")));
  const challengeSeconds = Math.round(
    challengeTaskResults.reduce((sum, r) => sum + (r.resultMs ?? 0), 0) / 1000
  );

  const totalSeconds = Math.max(1, wallClockSeconds - challengeSeconds);

  await db
    .update(workoutSessions)
    .set({ status: "completed", completedAt: new Date(), totalSeconds })
    .where(eq(workoutSessions.id, sessionId));

  revalidatePath("/");
  redirect(`/workout/${session.workoutId}/done`);
}

export async function abandonSessionAction(sessionId: string) {
  const user = await requireUser();
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, user.id)))
    .limit(1);
  if (!session) redirect("/");

  await db
    .update(workoutSessions)
    .set({ status: "abandoned", completedAt: new Date() })
    .where(eq(workoutSessions.id, sessionId));

  revalidatePath("/");
  redirect("/");
}

export async function getTaskOrder(workoutId: string) {
  return db
    .select()
    .from(workoutTasks)
    .where(eq(workoutTasks.workoutId, workoutId))
    .orderBy(workoutTasks.order);
}
