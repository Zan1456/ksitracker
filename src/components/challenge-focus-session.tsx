"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { Ring } from "@/components/ring";
import { toast } from "@/lib/toast-store";
import { playCountdownBeep, playTransitionChime } from "@/lib/sound";
import {
  completeChallengeTaskAction,
  completeChallengeSessionAction,
  abandonChallengeSessionAction,
} from "@/app/challenge/actions";

type ChallengeLiveTask = {
  id: string;
  name: string;
  note: string | null;
  targetDistanceMeters: number | null;
  resultKind: "time" | "reps";
};

type TaskResult = { resultMs?: number; resultReps?: number };

function formatClock(ms: number): string {
  const totalTenths = Math.max(0, Math.round(ms / 100));
  const tenths = totalTenths % 10;
  const totalSeconds = Math.floor(totalTenths / 10);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Compact value shown in the always-visible task list, e.g. "400 m", "60 mp". */
function footerValue(t: ChallengeLiveTask): string {
  if (t.resultKind === "reps") return "60 mp";
  return t.targetDistanceMeters ? `${t.targetDistanceMeters} m` : "stopper";
}

const secondaryBtn =
  "flex-1 rounded-[9px] border border-border-strong bg-bg-inset px-4 py-3.5 text-[14px] font-medium text-text";
const primaryBtn =
  "flex-1 rounded-[9px] border-0 bg-text px-4 py-3.5 text-[14px] font-medium text-bg";

/**
 * Runs a single challenge task — either an open-ended stopwatch (resultKind
 * "time") or a 60s AMRAP-style rep count (resultKind "reps"). Which tasks
 * appear here was already decided by the user up front when starting the
 * challenge, so every task shown must be completed to finish the session.
 */
function ChallengeTaskRunner({
  task,
  onComplete,
}: {
  task: ChallengeLiveTask;
  onComplete: (result: TaskResult) => void;
}) {
  const isAmrap = task.resultKind === "reps";
  const [phase, setPhase] = useState<"active" | "awaiting-input">("active");
  const [running, setRunning] = useState(isAmrap);
  const [remainingMs, setRemainingMs] = useState(isAmrap ? 60_000 : 0);
  const [repsInput, setRepsInput] = useState("");
  const [swPhase, setSwPhase] = useState<"idle" | "running" | "stopped">("idle");
  const [elapsedMs, setElapsedMs] = useState(0);

  // 60s AMRAP countdown.
  useEffect(() => {
    if (!isAmrap || !running) return;
    const interval = setInterval(() => {
      setRemainingMs((prev) => {
        const next = prev - 100;
        if (next > 0) {
          // Beep once as the displayed countdown ticks over to 3, 2, and 1.
          const prevSec = Math.ceil(prev / 1000);
          const nextSec = Math.ceil(next / 1000);
          if (nextSec !== prevSec && nextSec >= 1 && nextSec <= 3) playCountdownBeep();
          return next;
        }
        clearInterval(interval);
        setRunning(false);
        playTransitionChime();
        setPhase("awaiting-input");
        return 0;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isAmrap, running]);

  // Open-ended stopwatch tick (counts up).
  useEffect(() => {
    if (isAmrap || swPhase !== "running") return;
    const interval = setInterval(() => setElapsedMs((prev) => prev + 100), 100);
    return () => clearInterval(interval);
  }, [isAmrap, swPhase]);

  const skipButton = (
    <button
      onClick={() => {
        playTransitionChime();
        onSkip();
      }}
      className="text-[12.5px] text-text-faint"
    >
      Kihagyás
    </button>
  );

  if (phase === "awaiting-input") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-8 text-center">
        <div className="text-[15px] text-text-muted">Hány ismétlést csináltál?</div>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          autoFocus
          value={repsInput}
          onChange={(e) => setRepsInput(e.target.value)}
          className="mono w-[160px] rounded-lg border border-border-strong bg-bg-inset px-4 py-3 text-center text-[32px] outline-none focus:border-accent-strong"
        />
        <button
          disabled={!repsInput}
          onClick={() => {
            playTransitionChime();
            onComplete({ resultReps: Number(repsInput) });
          }}
          className={cn(primaryBtn, "w-full flex-none disabled:opacity-50")}
        >
          Mentés és tovább
        </button>
        {skipButton}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4.5 px-6 py-6 text-center">
      <div className="mono text-[11px] tracking-[0.04em] text-warning">
        {isAmrap ? "IDŐZÍTETT FELADAT" : "STOPPERES FELADAT"}
      </div>

      {isAmrap ? (
        <div className="relative h-[236px] w-[236px]">
          <Ring fraction={1 - remainingMs / 60_000} color="#e0b341" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="mono text-[52px] font-light leading-none tracking-[-0.03em]">
              {formatCountdown(remainingMs)}
            </div>
          </div>
        </div>
      ) : (
        <div className="mono text-[72px] font-light leading-none tracking-[-0.03em]">
          {formatClock(elapsedMs)}
        </div>
      )}

      <div>
        <div className="mb-1.5 text-[20px] font-medium tracking-[-0.02em]">{task.name}</div>
        {task.note && <div className="text-[12.5px] leading-[1.4] text-text-muted">{task.note}</div>}
      </div>

      {isAmrap ? (
        <div className="flex w-full gap-2.5">
          <button
            onClick={() => setRemainingMs(60_000)}
            className="w-[52px] flex-none rounded-[9px] border border-border-strong bg-transparent text-[13px] font-medium text-text-secondary"
          >
            ↺
          </button>
          <button onClick={() => setRunning((r) => !r)} className={secondaryBtn}>
            {running ? "Szünet" : "Folytatás"}
          </button>
        </div>
      ) : swPhase !== "stopped" ? (
        <div className="flex w-full flex-col items-center gap-2.5">
          {swPhase === "idle" ? (
            <button onClick={() => setSwPhase("running")} className={cn(primaryBtn, "w-full flex-none")}>
              Indítás
            </button>
          ) : (
            <div className="flex w-full gap-2.5">
              <button onClick={() => setSwPhase("idle")} className={secondaryBtn}>
                Szünet
              </button>
              <button onClick={() => setSwPhase("stopped")} className={primaryBtn}>
                Állj — véglegesítés
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex w-full gap-2.5">
          <button
            onClick={() => {
              setSwPhase("idle");
              setElapsedMs(0);
            }}
            className={secondaryBtn}
          >
            Újra
          </button>
          <button
            onClick={() => {
              playTransitionChime();
              onComplete({ resultMs: elapsedMs });
            }}
            className={primaryBtn}
          >
            Mentés és tovább
          </button>
        </div>
      )}

      {skipButton}
    </div>
  );
}

export function ChallengeFocusSession({
  sessionId,
  levelIndex,
  minRequired,
  tasks,
  visitedTaskIds,
  initialCompletedTaskIds,
}: {
  sessionId: string;
  levelIndex: number;
  minRequired: number;
  tasks: ChallengeLiveTask[];
  /** Tasks that already have a result row (completed or skipped) — used to resume. */
  visitedTaskIds: string[];
  initialCompletedTaskIds: string[];
}) {
  const [isPending, startTransition] = useTransition();

  const initialIndex = useMemo(() => {
    const visited = new Set(visitedTaskIds);
    const idx = tasks.findIndex((t) => !visited.has(t.id));
    return idx === -1 ? tasks.length : idx;
  }, [tasks, visitedTaskIds]);

  const [index, setIndex] = useState(initialIndex);
  const [doneIds, setDoneIds] = useState<Set<string>>(() => new Set(initialCompletedTaskIds));
  const task = tasks[index] as ChallengeLiveTask | undefined;

  useEffect(() => {
    if (index >= tasks.length) {
      startTransition(() => {
        completeChallengeSessionAction(sessionId);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function advance() {
    setIndex((i) => i + 1);
  }

  function handleComplete(result: TaskResult) {
    const finishedTask = task!;
    startTransition(async () => {
      await completeChallengeTaskAction({ sessionId, taskId: finishedTask.id, ...result });
      setDoneIds((prev) => new Set(prev).add(finishedTask.id));
      toast(`${finishedTask.name} kész`, "success");
      advance();
    });
  }

  function handleSkip() {
    const skippedTask = task!;
    startTransition(async () => {
      await skipChallengeTaskAction({ sessionId, taskId: skippedTask.id });
      advance();
    });
  }

  function quit() {
    if (!confirm("Biztosan megszakítod a challenge-t? A haladásod nem lesz kész.")) return;
    toast("Challenge megszakítva", "info");
    startTransition(() => abandonChallengeSessionAction(sessionId));
  }

  if (!task) {
    return <div className="flex min-h-screen items-center justify-center text-text-muted">Mentés…</div>;
  }

  const progressPct = Math.round((index / tasks.length) * 100);
  const passed = doneIds.size >= minRequired;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col">
      <div className="flex items-center justify-between px-5 pb-3 pt-3.5">
        <span className="mono text-[11px] text-text-muted">
          SZINT {levelIndex} CHALLENGE · {index + 1}/{tasks.length}
        </span>
        <span className={cn("mono text-[11px]", passed ? "text-success" : "text-text-muted")}>
          {doneIds.size}/{minRequired} TELJESÍTVE
        </span>
      </div>
      <div className="h-[3px] bg-border">
        <div className="h-[3px] bg-text transition-[width]" style={{ width: `${progressPct}%` }} />
      </div>

      <ChallengeTaskRunner key={task.id} task={task} onComplete={handleComplete} onSkip={handleSkip} />

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto border-t border-border px-5 pb-2 pt-4">
        <div className="mono mb-0.5 text-[10.5px] text-text-faint">FELADATOK</div>
        {tasks.map((t, i) => {
          const isVisited = i < index;
          const isCurrent = i === index;
          if (isVisited) {
            const isDone = doneIds.has(t.id);
            return (
              <div key={t.id} className="flex items-center gap-2.75 text-[12.5px] text-[#5f5f5f]">
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px]",
                    isDone ? "bg-success-bg text-success" : "border-[1.5px] border-border-strong text-text-faint"
                  )}
                >
                  {isDone ? "✓" : "–"}
                </span>
                <span className={cn("flex-1 truncate", isDone && "line-through")}>{t.name}</span>
                <span className="mono text-[11px]">{footerValue(t)}</span>
              </div>
            );
          }
          if (isCurrent) {
            return (
              <div
                key={t.id}
                className="-mx-2.75 flex items-center gap-2.75 rounded-lg bg-bg-inset px-2.75 py-2.25 text-[12.5px] font-medium"
              >
                <span className="h-4 w-4 shrink-0 rounded-full border-[1.5px] border-warning" />
                <span className="flex-1 truncate">{t.name}</span>
                <span className="mono text-[11px] text-warning">{footerValue(t)}</span>
              </div>
            );
          }
          return (
            <div key={t.id} className="flex items-center gap-2.75 text-[12.5px] text-text-muted">
              <span className="h-4 w-4 shrink-0 rounded-full border-[1.5px] border-border-strong" />
              <span className="flex-1 truncate">{t.name}</span>
              <span className="mono text-[11px]">{footerValue(t)}</span>
            </div>
          );
        })}
        <button
          onClick={quit}
          disabled={isPending}
          className="mt-auto py-3.5 text-center text-[12px] text-text-faint"
        >
          Challenge megszakítása
        </button>
      </div>
    </div>
  );
}
