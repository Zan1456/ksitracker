import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { challengeSessions, challengeTaskResults, levels } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import { getChallengeTasks } from "@/lib/challenge-data";
import { getUserSettings } from "@/lib/user-settings";
import { LiveSession } from "@/components/live-session";
import {
  completeChallengeTaskAction,
  completeChallengeSessionAction,
  abandonChallengeSessionAction,
} from "@/app/challenge/actions";

function footerValue(t: { targetDistanceMeters: number | null; resultKind: "time" | "reps" }): string {
  if (t.targetDistanceMeters) return `${t.targetDistanceMeters} m`;
  return t.resultKind === "reps" ? "60 mp" : "stopper";
}

export default async function ChallengeLivePage({ params }: { params: Promise<{ levelId: string }> }) {
  const { levelId } = await params;
  const user = await requireUser();

  const [[session], [level], allTasks, settings] = await Promise.all([
    db
      .select()
      .from(challengeSessions)
      .where(
        and(
          eq(challengeSessions.userId, user.id),
          eq(challengeSessions.levelId, levelId),
          eq(challengeSessions.status, "in_progress")
        )
      )
      .limit(1),
    db.select().from(levels).where(eq(levels.id, levelId)).limit(1),
    getChallengeTasks(),
    getUserSettings(user.id),
  ]);

  if (!session) redirect(`/challenge/${levelId}`);
  if (!level || allTasks.length === 0) redirect("/");

  // Legacy sessions started before task selection existed have no
  // `selectedTaskIds` — treat that as "every task", matching old behavior.
  const selectedIds = session.selectedTaskIds ? new Set(session.selectedTaskIds) : null;
  const selectedTasks = selectedIds ? allTasks.filter((t) => selectedIds.has(t.id)) : allTasks;
  if (selectedTasks.length === 0) redirect("/");

  const results = await db.select().from(challengeTaskResults).where(eq(challengeTaskResults.sessionId, session.id));
  const completedTaskIds = results.filter((r) => r.completed).map((r) => r.taskId);

  const tasks = selectedTasks.map((t) => ({ id: t.id, name: t.name, meta: footerValue(t) }));

  async function completeTask(taskId: string, resultMs: number) {
    "use server";
    await completeChallengeTaskAction({ sessionId: session!.id, taskId, resultMs });
  }
  async function finish() {
    "use server";
    await completeChallengeSessionAction(session!.id);
  }
  async function abandon() {
    "use server";
    await abandonChallengeSessionAction(session!.id);
  }

  return (
    <LiveSession
      title={`${level.name} szintzáró`}
      kicker="KIHÍVÁS"
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
