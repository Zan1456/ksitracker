"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { IconCheck, IconChevronDown, IconLock } from "@/components/icons";
import { formatHoursMinutes, formatSeconds } from "@/lib/format";
import { Button } from "@/components/ui/button";
import type { LevelWithProgress } from "@/lib/workout-data";
import { startSessionAction } from "@/app/workout/actions";

type Props = {
  levels: LevelWithProgress[];
  dailyLimitAllowed: boolean;
  nextDayLabel: string;
  inProgressWorkoutId?: string;
};

export function LevelAccordion({ levels, dailyLimitAllowed, nextDayLabel, inProgressWorkoutId }: Props) {
  const defaultOpenIndex = levels.findIndex((l) => !l.locked && l.doneCount < l.totalCount);
  const [openId, setOpenId] = useState<string | null>(
    levels[defaultOpenIndex >= 0 ? defaultOpenIndex : 0]?.id ?? null
  );

  return (
    <div className="flex flex-col gap-2.5">
      {levels.map((level) => {
        const isOpen = openId === level.id;
        const isFullyDone = level.totalCount > 0 && level.doneCount === level.totalCount;
        const nextWorkoutIndex = level.workouts.findIndex((w) => !w.done);
        const totalMinutes = level.workouts.reduce(
          (sum, w) => sum + (w.bestSeconds ? Math.round(w.bestSeconds / 60) : w.estimatedMinutes),
          0
        );

        return (
          <div
            key={level.id}
            className={cn(
              "rounded-[10px] border transition-colors",
              level.locked
                ? "border-border bg-bg-elevated opacity-55"
                : isOpen
                  ? "border-border-strong bg-bg-inset"
                  : "border-border bg-bg-elevated"
            )}
          >
            <button
              type="button"
              disabled={level.locked}
              onClick={() => setOpenId(isOpen ? null : level.id)}
              className="flex w-full items-center gap-3 p-3.5 text-left disabled:cursor-default"
            >
              {level.locked ? (
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-border-strong text-text-faint">
                  <IconLock width={11} height={11} />
                </span>
              ) : isFullyDone ? (
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-success-bg text-success">
                  <IconCheck width={12} height={12} strokeWidth={2.5} />
                </span>
              ) : (
                <span className="mono flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-warning text-[10px] font-medium text-warning">
                  {level.doneCount + 1}
                </span>
              )}

              <div className="flex-1">
                <div className="text-[13.5px] font-medium leading-[1.3]">
                  Szint {level.index} · {level.name}
                </div>
                <div className="mono mt-1 text-[10.5px] text-text-faint">
                  {level.locked
                    ? "ZÁROLT"
                    : isFullyDone
                      ? `${level.totalCount} EDZÉS · ${formatHoursMinutes(totalMinutes)} Ó`
                      : `${level.doneCount}/${level.totalCount} KÉSZ · ${level.totalCount - level.doneCount} HÁTRA`}
                </div>
              </div>

              {!level.locked && (
                <IconChevronDown
                  width={14}
                  height={14}
                  className={cn("text-text-muted transition-transform", isOpen && "rotate-180")}
                />
              )}
            </button>

            {isOpen && !level.locked && (
              <div className="flex flex-col gap-3 border-t border-border p-3.5">
                {level.workouts.map((w, i) => {
                  const isNext = i === nextWorkoutIndex;
                  return (
                    <div key={w.id} className="flex items-center gap-2.5 text-[12.5px]">
                      {w.done ? (
                        <IconCheck width={11} height={11} className="shrink-0 text-success" strokeWidth={2.5} />
                      ) : (
                        <span
                          className={cn(
                            "h-[11px] w-[11px] shrink-0 rounded-full border-[1.5px]",
                            isNext ? "border-text-faint" : "border-border-strong"
                          )}
                        />
                      )}
                      <Link
                        href={`/workout/${w.id}`}
                        className={cn(
                          "flex-1 truncate hover:underline",
                          w.done ? "text-text-muted" : isNext ? "font-medium text-text" : "text-text-faint"
                        )}
                      >
                        {w.name}
                      </Link>
                      <span className="mono text-[11px] text-text-muted">
                        {w.done && w.bestSeconds ? formatSeconds(w.bestSeconds) : null}
                      </span>
                    </div>
                  );
                })}

                {nextWorkoutIndex >= 0 &&
                  (inProgressWorkoutId === level.workouts[nextWorkoutIndex].id ? (
                    <Link href={`/workout/${inProgressWorkoutId}/live`}>
                      <Button type="button" className="mt-0.5 w-full" size="md">
                        Folytatás
                      </Button>
                    </Link>
                  ) : (
                    <form action={startSessionAction.bind(null, level.workouts[nextWorkoutIndex].id)}>
                      <Button
                        type="submit"
                        variant={dailyLimitAllowed ? "primary" : "ghost"}
                        disabled={!dailyLimitAllowed}
                        className="mt-0.5 w-full"
                        size="md"
                      >
                        {level.workouts[nextWorkoutIndex].name} indítása
                        {!dailyLimitAllowed && (
                          <span className="mono text-[11px] text-warning">{nextDayLabel}</span>
                        )}
                      </Button>
                    </form>
                  ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
