import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { challengeSessions, challengeTaskResults, levels } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import { getChallengeTasks, getOrCreateChallengeSettings } from "@/lib/challenge-data";
import { ChallengeFocusSession } from "@/components/challenge-focus-session";

export default async function ChallengeLivePage({ params }: { params: Promise<{ levelId: string }> }) {
  const { levelId } = await params;
  const user = await requireUser();

  const [[session], [level], tasks, settings] = await Promise.all([
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
    getOrCreateChallengeSettings(),
  ]);

  if (!session) redirect(`/challenge/${levelId}`);
  if (!level || tasks.length === 0) redirect("/");

  const results = await db
    .select()
    .from(challengeTaskResults)
    .where(eq(challengeTaskResults.sessionId, session.id));
  const visitedTaskIds = results.map((r) => r.taskId);
  const initialCompletedTaskIds = results.filter((r) => r.completed).map((r) => r.taskId);

  return (
    <ChallengeFocusSession
      sessionId={session.id}
      levelIndex={level.index}
      minRequired={settings.minRequired}
      tasks={tasks.map((t) => ({
        id: t.id,
        name: t.name,
        note: t.note,
        targetDistanceMeters: t.targetDistanceMeters,
        resultKind: t.resultKind,
      }))}
      visitedTaskIds={visitedTaskIds}
      initialCompletedTaskIds={initialCompletedTaskIds}
    />
  );
}
