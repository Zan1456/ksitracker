import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { workoutSessions, taskResults } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import { getWorkoutWithTasks } from "@/lib/workout-data";
import { getUserSettings } from "@/lib/user-settings";
import { taskRowDisplay } from "@/lib/format";
import { LiveSession } from "@/components/live-session";
import { completeTaskAction, completeSessionAction, abandonSessionAction } from "@/app/workout/actions";

export default async function WorkoutLivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const [[session], data, settings] = await Promise.all([
    db
      .select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, user.id),
          eq(workoutSessions.workoutId, id),
          eq(workoutSessions.status, "in_progress")
        )
      )
      .limit(1),
    getWorkoutWithTasks(id),
    getUserSettings(user.id),
  ]);

  if (!session) redirect(`/workout/${id}`);
  if (!data) redirect("/");

  const results = await db.select().from(taskResults).where(eq(taskResults.sessionId, session.id));
  const completedTaskIds = results.filter((r) => r.completed).map((r) => r.taskId);

  // "rest" tasks have no place in the new lap-based engine — the fixed
  // auto-rest between every task supersedes them.
  const tasks = data.tasks
    .filter((t) => t.type !== "rest")
    .map((t) => {
      const row = taskRowDisplay(t);
      return { id: t.id, name: t.name, meta: row.subtext ? `${row.value} · ${row.subtext}` : row.value };
    });

  async function completeTask(taskId: string, resultMs: number) {
    "use server";
    await completeTaskAction({ sessionId: session!.id, taskId, resultMs });
  }
  async function finish() {
    "use server";
    await completeSessionAction(session!.id);
  }
  async function abandon() {
    "use server";
    await abandonSessionAction(session!.id);
  }

  return (
    <LiveSession
      title={data.workout.name}
      kicker="EDZÉS"
      tasks={tasks}
      initialCompletedTaskIds={completedTaskIds}
      startedAt={session.startedAt.toISOString()}
      autoRestEnabled={settings.autoRestEnabled}
      soundEnabled={settings.soundEnabled}
      onCompleteTask={completeTask}
      onFinish={finish}
      onAbandon={abandon}
    />
  );
}
