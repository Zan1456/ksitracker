import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import {
  getLevelsWithProgress,
  getStreakDays,
  getDailyLimitInfo,
  getCurrentLevelIndex,
} from "@/lib/workout-data";
import { getChallengeDailyLimitInfo } from "@/lib/challenge-data";
import { msUntilNextDay } from "@/lib/format";
import { AppShell, BrandMark } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { Avatar } from "@/components/avatar";
import { LevelList } from "@/components/level-list";
import { DailyLimitCountdownBanner, InProgressBanner } from "@/components/daily-limit-banner";
import { PageTransition } from "@/components/motion/page-transition";

export default async function HomePage() {
  const user = await requireUser();

  const [levels, streak, limit, challengeLimit] = await Promise.all([
    getLevelsWithProgress(user.id),
    getStreakDays(user.id),
    getDailyLimitInfo(user.id),
    getChallengeDailyLimitInfo(user.id),
  ]);

  const totalWorkouts = levels.reduce((s, l) => s + l.totalCount, 0);
  const doneWorkouts = levels.reduce((s, l) => s + l.doneCount, 0);
  const currentLevelIndex = getCurrentLevelIndex(levels);
  const firstName = (user.name ?? "?").trim().split(/\s+/)[0];

  return (
    <AppShell nav="user">
      <div className="glass sticky top-0 z-10 flex items-center justify-between border-b px-5 py-3.5">
        <BrandMark />
        <div className="flex items-center gap-2.25">
          <span className="mono rounded-full border border-border-strong px-2.5 py-1.5 text-[11px] font-medium text-text-muted">
            {streak} nap
          </span>
          <Link href="/profile">
            <Avatar name={user.name ?? "?"} size={28} />
          </Link>
        </div>
      </div>

      <PageTransition className="gap-4.5 overflow-y-auto px-5 pb-6 pt-4.5">
        <div>
          <h1 className="mb-1.25 text-[23px] font-medium leading-[1.15] tracking-[-0.03em]">
            Szia, {firstName}
          </h1>
          <p className="text-[13px] text-text-muted">
            {doneWorkouts} / {totalWorkouts} edzés kész · Szint {currentLevelIndex} folyamatban
          </p>
        </div>

        {limit.reason === "already_in_progress" && limit.inProgressWorkoutId && (
          <InProgressBanner href={`/workout/${limit.inProgressWorkoutId}/live`} />
        )}
        {limit.reason === "limit_reached" && (
          <DailyLimitCountdownBanner initialMs={msUntilNextDay()} />
        )}
        {challengeLimit.reason === "already_in_progress" && challengeLimit.inProgressLevelId && (
          <InProgressBanner
            href={`/challenge/${challengeLimit.inProgressLevelId}/live`}
            label="Folyamatban lévő challenge-próbálkozásod van."
          />
        )}

        <LevelList levels={levels} dailyLimitAllowed={limit.canStartNew} />
      </PageTransition>

      <BottomNav variant="user" />
    </AppShell>
  );
}
