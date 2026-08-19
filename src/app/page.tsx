import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import {
  getLevelsWithProgress,
  getWeekStrip,
  getStreakDays,
  getDailyLimitInfo,
} from "@/lib/workout-data";
import { weekdayLabel, timeUntilNextDayLabel } from "@/lib/format";
import { AppShell, BrandMark } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { Avatar } from "@/components/avatar";
import { LevelAccordion } from "@/components/level-accordion";
import { IconCheck } from "@/components/icons";
import { cn } from "@/lib/cn";

export default async function HomePage() {
  const user = await requireUser();

  const [levels, week, streak, limit] = await Promise.all([
    getLevelsWithProgress(user.id),
    getWeekStrip(user.id),
    getStreakDays(user.id),
    getDailyLimitInfo(user.id),
  ]);

  const totalWorkouts = levels.reduce((s, l) => s + l.totalCount, 0);
  const doneWorkouts = levels.reduce((s, l) => s + l.doneCount, 0);

  return (
    <AppShell>
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <BrandMark />
        <Link href="/profile">
          <Avatar name={user.name ?? "?"} size={28} />
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-5 px-5 pb-6 pt-4.5">
        <div className="flex justify-between gap-1.5">
          {week.map((d) => (
            <div key={d.iso} className="flex-1 text-center">
              <div className="mono mb-2 text-[10px] text-text-faint">{weekdayLabel(d.iso)}</div>
              <div
                className={cn(
                  "flex h-[34px] items-center justify-center rounded-lg border text-[11px] font-medium",
                  d.done && d.isToday
                    ? "border-warning-border bg-warning-bg text-warning"
                    : d.done
                      ? "border-success-border bg-success-bg text-success"
                      : d.isFuture
                        ? "border-dashed border-border bg-bg-elevated"
                        : "border-border bg-bg-elevated"
                )}
              >
                {d.done && <IconCheck width={12} height={12} strokeWidth={2.5} />}
              </div>
            </div>
          ))}
        </div>

        <div>
          <h1 className="mb-1.5 text-[22px] font-medium leading-[1.2] tracking-[-0.03em]">
            {doneWorkouts} / {totalWorkouts} edzés
          </h1>
          <p className="text-[12.5px] text-text-muted">
            {streak > 0 ? `${streak} napos sorozat` : "Kezdd el a sorozatod"}
            {" · "}
            {limit.reason === "already_in_progress"
              ? "van egy folyamatban lévő edzésed"
              : limit.canStartNew
                ? "ma még csinálhatsz edzést"
                : "a mai edzés kész"}
          </p>
        </div>

        <LevelAccordion
          levels={levels}
          dailyLimitAllowed={limit.canStartNew}
          nextDayLabel={timeUntilNextDayLabel()}
          inProgressWorkoutId={limit.inProgressWorkoutId}
        />
      </div>

      <BottomNav variant="user" />
    </AppShell>
  );
}
