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
import { Button } from "@/components/ui/button";
import { HomeTipCard } from "@/components/home-tip-card";
import { DailyLimitCountdownBanner, InProgressBanner } from "@/components/daily-limit-banner";
import { PageTransition } from "@/components/motion/page-transition";
import { cn } from "@/lib/cn";

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

  const next = getNextAction(levels);
  const challengesDone = levels.filter((l) => l.challengePassed).length;

  const name = user.name ?? "?";

  const nextIsChallenge = next?.type === "challenge";
  const nextLimit = nextIsChallenge ? challengeLimit : limit;
  const nextBlocked = !!next && !nextLimit.canStartNew;
  const showNextAction = !!next && nextLimit.reason !== "already_in_progress";

  return (
    <AppShell>
      <PageTransition className="gap-3.5 overflow-y-auto px-5.5 pb-6 pt-1.5">
        <div className="flex items-center justify-between gap-3">
          <BrandMark />
          <Link href="/profile" className="shrink-0">
            <Avatar name={name} size={44} className="!bg-white/16 !border-white/20 !text-white" />
          </Link>
        </div>

        <div
          className="h-px"
          style={{
            background:
              "repeating-linear-gradient(90deg,rgba(255,255,255,.35) 0 6px,transparent 6px 12px)",
          }}
        />

        {limit.reason === "already_in_progress" && limit.inProgressWorkoutId && (
          <InProgressBanner href={`/workout/${limit.inProgressWorkoutId}/live`} />
        )}
        {limit.reason === "limit_reached" && <DailyLimitCountdownBanner initialMs={msUntilNextDay()} />}
        {challengeLimit.reason === "already_in_progress" && challengeLimit.inProgressLevelId && (
          <InProgressBanner
            href={`/challenge/${challengeLimit.inProgressLevelId}/live`}
            label="Folyamatban lévő kihívás-próbálkozásod van."
          />
        )}

        {next ? (
          <div
            className={cn(
              "flex flex-col gap-3.5 rounded-[26px] border border-white/18 p-5",
              nextIsChallenge ? "bg-accent text-accent-fg" : "bg-white/10 text-white"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="mono text-[10.5px] tracking-[0.14em] opacity-70">
                {nextIsChallenge ? "SZINTZÁRÓ KIHÍVÁS" : `KÖVETKEZŐ EDZÉS · ${next.level.doneCount + 1}/${next.level.totalCount}`}
              </span>
              <Link href="/path" className="text-[12.5px] font-bold opacity-90">
                Szintterv →
              </Link>
            </div>
            <div>
              <div className="text-[22px] font-extrabold leading-[1.15] tracking-[-0.02em]">
                {nextIsChallenge ? `${next.level.name} szintzáró` : next.workout.name}
              </div>
              <div className="mt-2.25 text-[12.5px] font-semibold leading-[1.45] opacity-72">
                {nextIsChallenge
                  ? "Válaszd ki, mely feladatokat vállalod — az idők a ranglistára kerülnek."
                  : `${next.workout.taskCount} feladat · ${next.level.name} szint`}
              </div>
            </div>
            <div className="flex items-center gap-1.25">
              {next.level.workouts.map((w, i) => (
                <span
                  key={w.id}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    i < next.level.doneCount ? (nextIsChallenge ? "bg-[#0A0A0B]" : "bg-accent") : "bg-white/28"
                  )}
                />
              ))}
            </div>
            {showNextAction &&
              (nextBlocked ? (
                <Button size="lg" disabled className="w-full">
                  {nextIsChallenge ? "Kihívás megnyitása" : "Edzés indítása"}
                </Button>
              ) : (
                <Link href={nextIsChallenge ? `/challenge/${next.level.id}` : `/workout/${next.workout.id}`}>
                  <Button variant={nextIsChallenge ? "dark" : "primary"} size="lg" className="w-full">
                    {nextIsChallenge ? "Kihívás megnyitása" : "Edzés indítása"}
                  </Button>
                </Link>
              ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2 rounded-[26px] border border-white/18 bg-white/10 p-5 text-white">
            <div className="text-[22px] font-extrabold leading-[1.15] tracking-[-0.02em]">
              Minden szint teljesítve!
            </div>
            <p className="m-0 text-[12.5px] font-semibold leading-[1.45] opacity-72">
              Gratulálunk — nézd meg a ranglistát, vagy ismételd meg egy korábbi edzésed a szinttervről.
            </p>
          </div>
        )}

        <HomeTipCard />

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-[22px] border border-white/16 bg-white/10 p-4.25">
            <div className="mono text-[27px] font-extrabold leading-none">{streak}</div>
            <div className="mono mt-2.5 text-[10.5px] tracking-[0.1em] text-white/65">NAPOS SOROZAT</div>
          </div>
          <div className="rounded-[22px] border border-white/16 bg-white/10 p-4.25">
            <div className="mono text-[27px] font-extrabold leading-none">{challengesDone}</div>
            <div className="mono mt-2.5 text-[10.5px] tracking-[0.1em] text-white/65">TELJESÍTETT KIHÍVÁS</div>
          </div>
        </div>

        <div className="h-24 shrink-0" aria-hidden />
      </PageTransition>

      <BottomNav variant="user" />
    </AppShell>
  );
}
