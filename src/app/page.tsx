import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import {
  getLevelsWithProgress,
  getStreakDays,
  getDailyLimitInfo,
  type LevelWithProgress,
  type WorkoutWithStatus,
} from "@/lib/workout-data";
import { getChallengeDailyLimitInfo } from "@/lib/challenge-data";
import { msUntilNextDay } from "@/lib/format";
import { AppShell, BrandMark } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { Avatar } from "@/components/avatar";
import { Ring } from "@/components/ring";
import { Button } from "@/components/ui/button";
import { LevelList } from "@/components/level-list";
import { DailyLimitCountdownBanner, InProgressBanner } from "@/components/daily-limit-banner";
import { PageTransition } from "@/components/motion/page-transition";

type NextAction =
  | { type: "workout"; workout: WorkoutWithStatus; level: LevelWithProgress }
  | { type: "challenge"; level: LevelWithProgress };

/** The next thing the user would tap to keep going — a specific workout, or the level's challenge once every workout in it is done. */
function getNextAction(levels: LevelWithProgress[]): NextAction | null {
  for (const level of levels) {
    if (level.locked) continue;
    const workout = level.workouts.find((w) => !w.done);
    if (workout) return { type: "workout", workout, level };
    if (level.workouts.length > 0 && !level.challengePassed) return { type: "challenge", level };
  }
  return null;
}

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
  const pct = totalWorkouts > 0 ? doneWorkouts / totalWorkouts : 0;
  const next = getNextAction(levels);

  const nextIsChallenge = next?.type === "challenge";
  const nextLimit = nextIsChallenge ? challengeLimit : limit;
  const nextBlocked = !!next && !nextLimit.canStartNew;
  const showNextAction = !!next && nextLimit.reason !== "already_in_progress";

  return (
    <AppShell>
      <div className="glass sticky top-0 z-10 flex items-center justify-between border-b px-5 py-3.5">
        <BrandMark />
        <Link href="/profile">
          <Avatar name={user.name ?? "?"} size={28} />
        </Link>
      </div>

      <PageTransition className="gap-5 overflow-y-auto px-5 pb-6 pt-6">
        <div className="flex flex-col items-center gap-4 pb-1 text-center">
          <div className="relative" style={{ width: 168, height: 168 }}>
            <Ring fraction={pct} color="var(--color-accent)" size={168} strokeWidth={4} />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <div className="mono text-[34px] font-medium leading-none tracking-[-0.03em]">
                {Math.round(pct * 100)}
                <span className="text-[16px] text-text-faint">%</span>
              </div>
              <div className="mono text-[10.5px] text-text-faint">
                {doneWorkouts} / {totalWorkouts} EDZÉS
              </div>
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-[17px] font-medium tracking-[-0.02em]">
              {streak > 0 ? `${streak} napos sorozat` : "Kezdd el a sorozatod"}
            </div>
            <p className="text-[12.5px] text-text-muted">
              {limit.reason === "limit_reached"
                ? "Mára nincs több edzés"
                : limit.reason === "already_in_progress"
                  ? "Folyamatban lévő edzésed van"
                  : `Ma még ${limit.limitToday - limit.usedToday} edzés indítható`}
            </p>
          </div>
        </div>

        {limit.reason === "already_in_progress" && limit.inProgressWorkoutId && (
          <InProgressBanner href={`/workout/${limit.inProgressWorkoutId}/live`} />
        )}
        {limit.reason === "limit_reached" && <DailyLimitCountdownBanner initialMs={msUntilNextDay()} />}
        {challengeLimit.reason === "already_in_progress" && challengeLimit.inProgressLevelId && (
          <InProgressBanner
            href={`/challenge/${challengeLimit.inProgressLevelId}/live`}
            label="Folyamatban lévő challenge-próbálkozásod van."
          />
        )}

        {showNextAction &&
          (nextBlocked ? (
            <Button size="lg" disabled className="w-full justify-between">
              <span>{nextIsChallenge ? "Challenge" : `Következő: ${next!.workout.name}`}</span>
              <span className="mono text-[11px]">HOLNAP</span>
            </Button>
          ) : (
            <Link href={nextIsChallenge ? `/challenge/${next!.level.id}` : `/workout/${next!.workout.id}`}>
              <Button size="lg" className="w-full justify-between">
                <span>{nextIsChallenge ? "Challenge" : `Következő: ${next!.workout.name}`}</span>
                <span className="mono text-[11px] text-bg/60">
                  SZINT {next!.level.index}
                  {nextIsChallenge ? "" : ` · ${next!.workout.estimatedMinutes} P`}
                </span>
              </Button>
            </Link>
          ))}

        <LevelList levels={levels} dailyLimitAllowed={limit.canStartNew} challengeLimitAllowed={challengeLimit.canStartNew} />
      </PageTransition>

      <BottomNav variant="user" />
    </AppShell>
  );
}
