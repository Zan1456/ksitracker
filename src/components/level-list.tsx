import Link from "next/link";
import { cn } from "@/lib/cn";
import { IconCheck } from "@/components/icons";
import { formatHoursMinutes } from "@/lib/format";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-list";
import type { LevelWithProgress } from "@/lib/workout-data";

const rowClass =
  "flex items-center gap-3.25 rounded-[11px] border p-3.5 transition-transform active:scale-[0.98]";

export function LevelList({
  levels,
  dailyLimitAllowed,
  challengeLimitAllowed,
}: {
  levels: LevelWithProgress[];
  dailyLimitAllowed: boolean;
  challengeLimitAllowed: boolean;
}) {
  return (
    <StaggerContainer className="flex flex-col gap-2">
      {levels.map((level) => {
        const workoutsDone = level.totalCount > 0 && level.doneCount === level.totalCount;
        const isFullyDone = workoutsDone && level.challengePassed;
        const remaining = level.totalCount - level.doneCount;
        const nextWorkout = level.workouts.find((w) => !w.done);

        const badge = level.locked ? (
          <span className="h-[26px] w-[26px] shrink-0 rounded-full border-[1.5px] border-border-strong" />
        ) : isFullyDone ? (
          <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-success-bg text-success">
            <IconCheck width={11} height={11} strokeWidth={3} />
          </span>
        ) : (
          <span className="mono flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-text text-[11px] font-medium">
            {level.doneCount}
          </span>
        );

        const subtext = level.locked
          ? `SZINT ${level.index - 1} UTÁN NYÍLIK`
          : isFullyDone
            ? `${level.doneCount}/${level.totalCount} EDZÉS · ${formatHoursMinutes(
                Math.round(level.workouts.reduce((s, w) => s + (w.bestSeconds ?? 0), 0) / 60)
              )} Ó`
            : workoutsDone
              ? "MIND KÉSZ · CHALLENGE HÁTRA"
              : `${level.doneCount}/${level.totalCount} EDZÉS · ${remaining} HÁTRA`;

        const label = (
          <div className="min-w-0 flex-1">
            <div className={cn("truncate text-[13.5px] font-medium", level.locked && "text-text-muted")}>
              Szint {level.index} · {level.name}
            </div>
            <div className="mono mt-1.25 text-[10.5px] text-text-faint">{subtext}</div>
          </div>
        );

        // Locked and fully-done levels are informational only — nothing to
        // jump into. The current level's row links straight to whatever's
        // next in it (a workout, or the challenge once all workouts are done).
        if (level.locked || isFullyDone) {
          return (
            <StaggerItem key={level.id}>
              <div
                className={cn(
                  rowClass,
                  level.locked ? "border-border bg-bg-inset opacity-60" : "border-border bg-bg-elevated"
                )}
              >
                {badge}
                {label}
              </div>
            </StaggerItem>
          );
        }

        const href = workoutsDone ? `/challenge/${level.id}` : `/workout/${nextWorkout!.id}`;
        const blocked = workoutsDone ? !challengeLimitAllowed : !dailyLimitAllowed;

        if (blocked) {
          return (
            <StaggerItem key={level.id}>
              <div className={cn(rowClass, "border-text bg-bg-elevated")}>
                {badge}
                {label}
                <span className="mono shrink-0 rounded-[7px] border border-border-strong bg-bg-inset px-2.25 py-1.75 text-[10.5px] font-medium text-text-faint">
                  Holnap
                </span>
              </div>
            </StaggerItem>
          );
        }

        return (
          <StaggerItem key={level.id}>
            <Link href={href} className={cn(rowClass, "border-text bg-bg-elevated")}>
              {badge}
              {label}
              <span className="text-[15px] text-text-faint">›</span>
            </Link>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
