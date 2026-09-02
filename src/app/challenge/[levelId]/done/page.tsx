import Link from "next/link";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { challengeSessions, challengeTaskResults, challengeTasks, levels } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import { getOrCreateChallengeSettings } from "@/lib/challenge-data";
import { formatSeconds } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

export default async function ChallengeDonePage({ params }: { params: Promise<{ levelId: string }> }) {
  const { levelId } = await params;
  const user = await requireUser();

  const [[session], [level], settings, allLevels] = await Promise.all([
    db
      .select()
      .from(challengeSessions)
      .where(
        and(
          eq(challengeSessions.userId, user.id),
          eq(challengeSessions.levelId, levelId),
          eq(challengeSessions.status, "completed")
        )
      )
      .orderBy(desc(challengeSessions.completedAt))
      .limit(1),
    db.select().from(levels).where(eq(levels.id, levelId)).limit(1),
    getOrCreateChallengeSettings(),
    db.select().from(levels),
  ]);

  const passed = session?.passed ?? false;
  const levelUp = passed && !!level && allLevels.some((l) => l.order > level.order);

  const splits = session
    ? await db
        .select({ name: challengeTasks.name, resultMs: challengeTaskResults.resultMs, order: challengeTasks.order })
        .from(challengeTaskResults)
        .innerJoin(challengeTasks, eq(challengeTaskResults.taskId, challengeTasks.id))
        .where(and(eq(challengeTaskResults.sessionId, session.id), eq(challengeTaskResults.completed, true)))
        .orderBy(asc(challengeTasks.order))
    : [];

  const head = passed ? (levelUp ? "szint\nteljesítve!" : "kihívás\nteljesítve!") : "ez most\nnem sikerült";
  const sub = passed
    ? levelUp
      ? "Az idők felkerültek a ranglistára, és megnyílt a következő szint."
      : "Az idők felkerültek a ranglistára."
    : `Legalább ${settings.minRequired} feladatot kell teljesíteni — próbáld újra holnap.`;

  return (
    <AppShell background="deep">
      <div className="animate-rise flex flex-1 flex-col justify-center gap-4.5 px-6.5 pb-8">
        <div
          className={
            "flex h-14.5 w-14.5 items-center justify-center rounded-full text-[24px] font-extrabold " +
            (passed ? "bg-accent text-accent-fg" : "border-2 border-warning-border bg-warning-bg text-warning")
          }
        >
          {passed ? "✓" : "!"}
        </div>
        <div>
          <h1 className="whitespace-pre-line text-[36px] font-extrabold leading-[1.04] tracking-[-0.035em]">
            {head}
          </h1>
          <p className="mt-3 text-[14px] font-medium leading-[1.5] text-white/75">{sub}</p>
        </div>

        {splits.length > 0 && (
          <div className="overflow-hidden rounded-[24px] border border-white/18 bg-white/10">
            <div className="flex items-baseline justify-between border-b border-white/10 px-5 py-4.5">
              <span className="mono text-[10.5px] tracking-[0.12em] text-white/65">TELJES IDŐ</span>
              <span className="mono text-[22px] font-semibold">
                {session?.totalSeconds != null ? formatSeconds(session.totalSeconds) : "—"}
              </span>
            </div>
            {splits.map((s) => (
              <div key={s.order} className="flex items-center border-b border-white/8 px-5 py-3.5 last:border-b-0">
                <span className="flex-1 text-[13.5px] font-semibold">{s.name}</span>
                <span className="mono text-[13.5px] font-bold text-accent">
                  {s.resultMs != null ? formatSeconds(Math.round(s.resultMs / 1000)) : "—"}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2.25">
          <Link href="/path">
            <Button size="lg" className="w-full">
              Szintterv
            </Button>
          </Link>
          <Link href="/leaderboard">
            <Button variant="secondary" size="lg" className="w-full">
              Ranglista
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
