import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { workoutSessions, taskResults } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import { getWorkoutWithTasks } from "@/lib/workout-data";
import { FocusSession } from "@/components/focus-session";

export default async function WorkoutLivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, user.id),
        eq(workoutSessions.workoutId, id),
        eq(workoutSessions.status, "in_progress")
      )
    )
    .limit(1);

  if (!session) redirect(`/workout/${id}`);

  const data = await getWorkoutWithTasks(id);
  if (!data) redirect("/");

  const results = await db
    .select()
    .from(taskResults)
    .where(eq(taskResults.sessionId, session.id));
  const completedTaskIds = results.filter((r) => r.completed).map((r) => r.taskId);

  return (
    <FocusSession
      sessionId={session.id}
      workoutName={data.workout.name}
      tasks={data.tasks.map((t) => ({
        id: t.id,
        name: t.name,
        note: t.note,
        type: t.type,
        targetReps: t.targetReps,
        targetSeconds: t.targetSeconds,
        targetDistanceMeters: t.targetDistanceMeters,
        resultKind: t.resultKind,
        rankDirection: t.rankDirection,
        rounds: t.rounds,
      }))}
      completedTaskIds={completedTaskIds}
    />
  );
}
