"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast-store";
import { IconLock } from "@/components/icons";
import type { LevelWithProgress } from "@/lib/workout-data";

export function PathScreen({
  levels,
  currentLevelIndex,
  challengeLimitAllowed,
  minRequired,
  poolCount,
}: {
  levels: LevelWithProgress[];
  currentLevelIndex: number;
  challengeLimitAllowed: boolean;
  minRequired: number;
  poolCount: number;
}) {
  const initialView = Math.max(
    0,
    levels.findIndex((l) => l.index === currentLevelIndex)
  );
  const [viewIdx, setViewIdx] = useState(initialView);
  const view = levels[viewIdx];

  const workoutsDone = view.totalCount > 0 && view.doneCount === view.totalCount;
  const challengeOpen = workoutsDone && !view.challengePassed;

  return (
    <>
      <div className="flex gap-2 overflow-x-auto px-5.5 pb-3">
        {levels.map((l, i) => (
          <button
            key={l.id}
            onClick={() => (l.locked ? toast("Ez a szint még zárolt.", "info") : setViewIdx(i))}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.75 text-[12px] font-bold",
              i === viewIdx ? "bg-white text-brand-blue" : "bg-white/14 text-white/85"
            )}
          >
            {l.name}
            {l.locked && <IconLock width={10.5} height={10.5} strokeWidth={2.2} />}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2.25 overflow-y-auto px-5.5">
        {view.workouts.map((w, i) => {
          const isDone = !view.locked && i < view.doneCount;
          const isCur = !view.locked && i === view.doneCount;
          const locked = view.locked || i > view.doneCount;

          const state = isDone ? "KÉSZ" : isCur ? "MOST" : "ZÁROLT";

          const row = (
            <div
              key={w.id}
              className={cn(
                "flex items-center gap-3.25 rounded-[22px] border border-white/15 p-4",
                isCur ? "bg-white text-brand-blue" : "bg-white/8 text-white",
                locked && !isDone && "opacity-55"
              )}
            >
              <span
                className={cn(
                  "flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full text-[12.5px] font-extrabold",
                  isDone ? "bg-accent text-accent-fg" : isCur ? "bg-[#0A0A0B] text-white" : "bg-white/16 text-white"
                )}
              >
                {isDone ? "✓" : locked ? <IconLock width={12} height={12} strokeWidth={2.2} /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14.5px] font-extrabold">{w.name}</span>
                <span className="mono mt-2 block text-[10.5px] tracking-[0.08em] opacity-68">
                  {w.taskCount} FELADAT
                </span>
              </span>
              <span className="mono shrink-0 text-[11px] font-bold tracking-[0.08em] opacity-75">{state}</span>
            </div>
          );

          if (locked && !isDone) {
            return (
              <button
                key={w.id}
                onClick={() => toast("Előbb teljesítsd az előző edzést.", "info")}
                className="text-left"
              >
                {row}
              </button>
            );
          }
          return (
            <Link key={w.id} href={`/workout/${w.id}`}>
              {row}
            </Link>
          );
        })}

        <ChallengeCard
          levelId={view.id}
          levelName={view.name}
          open={challengeOpen}
          passed={view.challengePassed}
          allowed={challengeLimitAllowed}
          minRequired={minRequired}
          poolCount={poolCount}
        />
        <div className="h-24 shrink-0" aria-hidden />
      </div>
    </>
  );
}

function ChallengeCard({
  levelId,
  levelName,
  open,
  passed,
  allowed,
  minRequired,
  poolCount,
}: {
  levelId: string;
  levelName: string;
  open: boolean;
  passed: boolean;
  allowed: boolean;
  minRequired: number;
  poolCount: number;
}) {
  const sub = passed
    ? "Teljesítve — az idők felkerültek a ranglistára."
    : `Válassz legalább ${minRequired} feladatot a ${poolCount} közül.`;
  const action = passed
    ? "Ranglista megtekintése →"
    : open
      ? allowed
        ? "Kihívás megnyitása →"
        : "Ma már próbálkoztál — gyere vissza holnap"
      : "Előbb teljesítsd a szint összes edzését";

  const card = (
    <div
      className={cn(
        "my-3 flex flex-col gap-3 rounded-[26px] border border-white/20 p-5",
        passed ? "bg-white/10 text-white" : open ? "bg-accent text-accent-fg" : "bg-white/6 text-white opacity-60"
      )}
    >
      <div className="mono text-[10.5px] tracking-[0.14em] opacity-70">SZINTZÁRÓ KIHÍVÁS</div>
      <div className="text-[22px] font-extrabold leading-[1.15] tracking-[-0.02em]">{levelName} szintzáró</div>
      <div className="text-[12.5px] font-semibold leading-[1.45] opacity-75">{sub}</div>
      <div className="text-[12px] font-bold opacity-90">{action}</div>
    </div>
  );

  if (passed) return <Link href="/leaderboard">{card}</Link>;
  if (open && allowed) return <Link href={`/challenge/${levelId}`}>{card}</Link>;
  return card;
}
