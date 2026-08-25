import Link from "next/link";
import { cn } from "@/lib/cn";
import { IconCheck } from "@/components/icons";
import { formatSeconds } from "@/lib/format";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-list";
import type { LevelWithProgress } from "@/lib/workout-data";

const pressClass = "transition-transform active:scale-[0.98]";

export function LevelList({
  levels,
  dailyLimitAllowed,
}: {
  levels: LevelWithProgress[];
  dailyLimitAllowed: boolean;
}) {
  return (
    <StaggerContainer className="flex flex-col gap-5">
      {levels.map((level) => {
        const isFullyDone = level.totalCount > 0 && level.doneCount === level.totalCount;
        const nextIndex = level.workouts.findIndex((w) => !w.done);

        return (
          <StaggerItem key={level.id} className="flex flex-col gap-2.25">
            <div className={cn("flex items-center gap-2.25", level.locked && "opacity-50")}>
              <span className="mono text-[11px] text-text-faint">SZINT {level.index}</span>
              <span className="text-[14px] font-medium">{level.name}</span>
              <span className="h-px flex-1 bg-border" />
              <span
                className={cn(
                  "mono text-[11px]",
                  level.locked ? "text-text-faint" : isFullyDone ? "text-success" : "text-text-secondary"
                )}
              >
                {level.locked ? "ZÁROLT" : `${level.doneCount}/${level.totalCount}`}
              </span>
            </div>

            {!level.locked && isFullyDone && (
              <div className="flex items-center gap-2.5 rounded-[9px] border border-border bg-bg-inset px-3.25 py-2.75 text-[12.5px] text-text-muted">
                Mind a {level.totalCount} edzés teljesítve
                <span className="mono ml-auto flex items-center gap-1.5 font-medium text-success">
                  <IconCheck width={11} height={11} strokeWidth={3} /> KÉSZ
                </span>
              </div>
            )}

            {!level.locked && !isFullyDone && (
              <div className="flex flex-col gap-2 md:grid md:grid-cols-2">
                {level.workouts.map((w, i) => {
                  const isNext = i === nextIndex;
                  const blocked = isNext && !dailyLimitAllowed;
                  const reachable = w.done || isNext;

                  const content = (
                    <>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.25 truncate text-[13.5px] font-medium">{w.name}</div>
                        <div className="mono text-[11px] text-text-faint">
                          {w.doneToday
                            ? `MA TELJESÍTVE · ${w.bestSeconds ? formatSeconds(w.bestSeconds) : "—"}`
                            : `${w.taskCount} FELADAT · ${w.estimatedMinutes} PERC`}
                        </div>
                      </div>
                      {w.done ? (
                        <span className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full bg-success-bg text-success">
                          <IconCheck width={10} height={10} strokeWidth={3} />
                        </span>
                      ) : blocked ? (
                        <span className="mono shrink-0 rounded-[7px] border border-border-strong bg-bg-inset px-2.5 py-2 text-[11.5px] font-medium text-text-faint">
                          Holnap
                        </span>
                      ) : null}
                    </>
                  );

                  const rowClass = cn(
                    "flex items-center gap-3 rounded-[9px] border p-3.25",
                    w.done
                      ? "border-border bg-bg-elevated"
                      : isNext
                        ? "border-border-strong bg-bg-inset"
                        : "border-border bg-bg-elevated opacity-50"
                  );

                  if (reachable && !blocked) {
                    return (
                      <Link key={w.id} href={`/workout/${w.id}`} className={cn(rowClass, pressClass)}>
                        {content}
                      </Link>
                    );
                  }
                  return (
                    <div key={w.id} className={rowClass}>
                      {content}
                    </div>
                  );
                })}
              </div>
            )}
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
