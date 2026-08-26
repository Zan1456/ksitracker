import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { challengeSessions, levels } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import { getOrCreateChallengeSettings } from "@/lib/challenge-data";
import { Button } from "@/components/ui/button";
import { SuccessCheck, FadeUp } from "@/components/motion/success-check";

export default async function ChallengeDonePage({ params }: { params: Promise<{ levelId: string }> }) {
  const { levelId } = await params;
  const user = await requireUser();

  const [[session], [level], settings] = await Promise.all([
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
  ]);

  const passed = session?.passed ?? false;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col items-center justify-center gap-6 px-7 text-center">
      {passed ? (
        <SuccessCheck />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-warning-border bg-warning-bg text-[28px] text-warning">
          !
        </div>
      )}
      <FadeUp delay={0.15}>
        <h1 className="mb-1.5 text-[24px] font-medium tracking-[-0.03em]">
          {passed ? "Challenge teljesítve!" : "Ez most nem sikerült"}
        </h1>
        <p className="text-[14px] text-text-muted">
          {passed
            ? `Szint ${level?.index} feloldva.`
            : `Legalább ${settings.minRequired} feladatot kell teljesíteni — próbáld újra holnap.`}
        </p>
      </FadeUp>
      <FadeUp delay={0.3}>
        <div className="mt-2 flex w-full flex-col gap-2.5">
          <Link href="/">
            <Button size="lg" className="w-full">
              Vissza a kezdőlapra
            </Button>
          </Link>
          <Link href="/leaderboard">
            <Button variant="secondary" size="lg" className="w-full">
              Ranglista megtekintése
            </Button>
          </Link>
        </div>
      </FadeUp>
    </div>
  );
}
