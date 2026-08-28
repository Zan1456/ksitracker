import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import {
  getLevelsWithProgress,
  getStreakDays,
  getDailyLimitInfo,
  getWeekStrip,
  getHistory,
  getTotalStats,
  type LevelWithProgress,
  type WorkoutWithStatus,
} from "@/lib/workout-data";
import { getChallengeDailyLimitInfo } from "@/lib/challenge-data";
import {
  msUntilNextDay,
  todayIso,
  monthDayLabel,
  relativeDayLabel,
  weekdayLabel,
  formatSeconds,
  formatHoursMinutes,
} from "@/lib/format";
import { cn } from "@/lib/cn";
import { AppShell, BrandMark } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { Avatar } from "@/components/avatar";
import { Ring } from "@/components/ring";
import { Button } from "@/components/ui/button";
import { LevelList } from "@/components/level-list";
import { ThemeToggleButton } from "@/components/theme-toggle";
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

  const [levels, streak, limit, challengeLimit, weekStrip, recentHistory, totalStats] = await Promise.all([
    getLevelsWithProgress(user.id),
    getStreakDays(user.id),
    getDailyLimitInfo(user.id),
    getChallengeDailyLimitInfo(user.id),
    getWeekStrip(user.id),
    getHistory(user.id, 3),
    getTotalStats(user.id),
  ]);

  const totalWorkouts = levels.reduce((s, l) => s + l.totalCount, 0);
  const doneWorkouts = levels.reduce((s, l) => s + l.doneCount, 0);
  const pct = totalWorkouts > 0 ? doneWorkouts / totalWorkouts : 0;
  const next = getNextAction(levels);
  const firstName = (user.name ?? "?").trim().split(/\s+/)[0];

  const nextIsChallenge = next?.type === "challenge";
  const nextLimit = nextIsChallenge ? challengeLimit : limit;
  const nextBlocked = !!next && !nextLimit.canStartNew;
  const showNextAction = !!next && nextLimit.reason !== "already_in_progress";

  const todayLabel = `${new Date().toLocaleDateString("hu-HU", { weekday: "long" }).toUpperCase()} · ${monthDayLabel(todayIso())}`;
  const statusLabel =
    limit.reason === "limit_reached"
      ? "MÁRA NINCS TÖBB EDZÉS"
      : limit.reason === "already_in_progress"
        ? "FOLYAMATBAN LÉVŐ EDZÉSED VAN"
        : `MA MÉG ${limit.limitToday - limit.usedToday} EDZÉS INDÍTHATÓ`;

  return (
    <AppShell nav="user" wide>
      {/* Mobile/tablet header — the desktop layout below `xl` is just this single-column card. */}
      <div className="glass sticky top-0 z-10 flex items-center justify-between border-b px-5 py-3.5 xl:hidden">
        <BrandMark />
        <Link href="/profile">
          <Avatar name={user.name ?? "?"} size={28} />
        </Link>
      </div>

      {/* Desktop header — the sidebar already carries the brand, so this is just the greeting + day actions. */}
      <div className="hidden items-center justify-between border-b border-border px-7 py-5 xl:flex">
        <div>
          <div className="text-[19px] font-medium tracking-[-0.02em]">Szia, {firstName}</div>
          <div className="mono mt-2 text-[11px] text-text-faint">
            {todayLabel} · {statusLabel}
          </div>
        </div>
        <div className="flex gap-2.5">
          <Link
            href="/profile"
            className="flex items-center rounded-[8px] border border-border-strong px-3.5 py-2 text-[12.5px] font-medium text-text-secondary"
          >
            Előzmények
          </Link>
          <ThemeToggleButton />
        </div>
      </div>

      {/* Mobile/tablet body */}
      <PageTransition className="gap-5 overflow-y-auto px-5 pb-6 pt-6 xl:hidden">
        <div className="flex flex-col items-center gap-4 pb-1 text-center">
          <div className="relative" style={{ width: 168, height: 168 }}>
            <Ring fraction={pct} color="var(--color-text)" size={168} strokeWidth={4} />
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

      {/* Desktop body — hero + level progress + recent workouts, with an overview rail on the right. */}
      <div className="hidden flex-1 gap-6 overflow-y-auto px-7 py-6 xl:flex">
        <div className="flex flex-1 flex-col gap-4.5">
          <div className="flex items-center gap-7 rounded-[14px] border border-border-strong bg-bg-elevated p-6.5">
            <div className="flex-1">
              <div className="mono mb-3.5 text-[10.5px] tracking-[0.08em] text-warning">
                {next ? `${nextIsChallenge ? "CHALLENGE" : "MAI EDZÉS"} · SZINT ${next.level.index}` : "MINDEN SZINT TELJESÍTVE"}
              </div>
              <div className="mb-2 text-[26px] font-medium tracking-[-0.03em]">
                {next ? (nextIsChallenge ? "Challenge" : next.workout.name) : "Gratulálunk!"}
              </div>
              {next && !nextIsChallenge && (
                <div className="text-[13.5px] text-text-muted">
                  {next.workout.taskCount} feladat · ~{next.workout.estimatedMinutes} perc
                </div>
              )}
            </div>
            {showNextAction &&
              (nextBlocked ? (
                <Button size="lg" disabled>
                  Holnap
                </Button>
              ) : (
                <Link href={nextIsChallenge ? `/challenge/${next!.level.id}` : `/workout/${next!.workout.id}`}>
                  <Button size="lg">{nextIsChallenge ? "Challenge indítása" : "Edzés indítása"}</Button>
                </Link>
              ))}
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="mono text-[10.5px] tracking-[0.08em] text-text-faint">SZINTEK</div>
            {levels.map((level) => {
              const levelPct = level.totalCount > 0 ? level.doneCount / level.totalCount : 0;
              const levelDone = level.totalCount > 0 && level.doneCount === level.totalCount && level.challengePassed;
              return (
                <div
                  key={level.id}
                  className="flex items-center gap-4 rounded-[11px] border border-border bg-bg-inset p-4"
                >
                  <span className="w-16 shrink-0 text-[13px] font-medium">Szint {level.index}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                    <span
                      className={cn(
                        "block h-1.5 rounded-full",
                        level.locked ? "bg-text-faint" : levelDone ? "bg-success" : "bg-warning"
                      )}
                      style={{ width: `${levelPct * 100}%` }}
                    />
                  </span>
                  <span
                    className={cn(
                      "mono w-24 shrink-0 text-right text-[11px]",
                      level.locked ? "text-text-faint" : levelDone ? "text-success" : "text-warning"
                    )}
                  >
                    {level.locked ? "ZÁROLT" : `${level.doneCount}/${level.totalCount} KÉSZ`}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="rounded-[11px] border border-border bg-bg-inset p-4.5">
            <div className="mono mb-1 text-[10.5px] tracking-[0.08em] text-text-faint">LEGUTÓBBI EDZÉSEK</div>
            {recentHistory.length === 0 ? (
              <p className="pt-2.5 text-[12.5px] text-text-muted">Még nincs teljesített edzésed.</p>
            ) : (
              recentHistory.map((h) => (
                <div
                  key={h.sessionId}
                  className="flex items-center gap-3.5 border-t border-border py-2.75 first:border-t-0"
                >
                  <span className="text-[11px] font-medium text-success">✓</span>
                  <span className="flex-1 truncate text-[13px]">{h.workoutName}</span>
                  <span className="mono text-[11px] text-text-faint">{relativeDayLabel(h.sessionDate)}</span>
                  <span className="mono w-14 shrink-0 text-right text-[11px] text-text-secondary">
                    {h.totalSeconds != null ? formatSeconds(h.totalSeconds) : "—"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex w-[290px] shrink-0 flex-col gap-3.5">
          <div className="flex flex-col items-center gap-3.5 rounded-[12px] border border-border bg-bg-inset p-5">
            <div className="relative" style={{ width: 150, height: 150 }}>
              <Ring fraction={pct} color="var(--color-text)" size={150} strokeWidth={4} />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <div className="mono text-[28px] font-medium leading-none tracking-[-0.03em]">
                  {Math.round(pct * 100)}
                  <span className="text-[13px] text-text-faint">%</span>
                </div>
                <div className="mono text-[10px] text-text-faint">
                  {doneWorkouts} / {totalWorkouts} EDZÉS
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-[14px] font-medium">Teljes terv</div>
              <div className="mono mt-1.5 text-[10.5px] text-text-faint">
                {totalWorkouts - doneWorkouts} EDZÉS VAN HÁTRA
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3.5 rounded-[12px] border border-border bg-bg-inset p-4.5">
            <div className="mono text-[10.5px] tracking-[0.08em] text-text-faint">HETI AKTIVITÁS</div>
            <div className="flex gap-1.5">
              {weekStrip.map((d) => (
                <div key={d.iso} className="flex-1 text-center">
                  <div className="mono mb-1.75 text-[10px] text-text-faint">{weekdayLabel(d.iso)}</div>
                  <div
                    className={cn(
                      "h-8 rounded-[7px] border",
                      d.done
                        ? "border-success-border bg-success-bg"
                        : d.isToday
                          ? "border-warning bg-bg"
                          : d.isFuture
                            ? "border-dashed border-border bg-bg"
                            : "border-border bg-bg"
                    )}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between border-t border-border pt-2.5">
              <span className="mono text-[11px] text-text-faint">SOROZAT</span>
              <span className="mono text-[11px]">{streak} NAP</span>
            </div>
            <div className="flex justify-between">
              <span className="mono text-[11px] text-text-faint">ÖSSZ. IDŐ</span>
              <span className="mono text-[11px]">{formatHoursMinutes(Math.round(totalStats.totalSeconds / 60))} Ó</span>
            </div>
          </div>
        </div>
      </div>

      <BottomNav variant="user" />
    </AppShell>
  );
}
