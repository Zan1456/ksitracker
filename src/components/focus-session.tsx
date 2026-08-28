"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { formatSeconds } from "@/lib/format";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast-store";
import { playCountdownBeep, playTransitionChime } from "@/lib/sound";
import { completeTaskAction, completeSessionAction, abandonSessionAction } from "@/app/workout/actions";

type RoundConfig = { work: number; restSeconds: number | null };

type LiveTask = {
  id: string;
  name: string;
  note: string | null;
  type: "reps" | "time" | "stopwatch" | "rest";
  targetReps: number | null;
  perSide: boolean;
  targetSeconds: number | null;
  targetDistanceMeters: number | null;
  resultKind: "time" | "reps" | null;
  rankDirection: "asc" | "desc" | null;
  rounds: number;
  restSeconds: number | null;
  /** Per-round work/rest overrides (e.g. 30-30, then 35-25) — null for uniform rounds. */
  roundsConfig: RoundConfig[] | null;
};

/** This round's work amount — seconds for "time" tasks, rep count for "reps" tasks — honoring a custom per-round schedule when set. */
function workForRound(t: LiveTask, round: number): number {
  const custom = t.roundsConfig?.[round - 1]?.work;
  if (custom != null) return custom;
  return (t.type === "time" || t.type === "rest" ? t.targetSeconds : t.targetReps) ?? 0;
}

/** The rest, in seconds, after finishing the given round — null means no rest. */
function restAfterRound(t: LiveTask, round: number): number | null {
  const custom = t.roundsConfig?.[round - 1];
  if (custom) return custom.restSeconds;
  return t.restSeconds ?? null;
}

type TaskResult = { resultMs?: number; resultReps?: number };

const RING_CIRCUMFERENCE = 282.7;

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

/** Compact value shown in the always-visible task list, e.g. "3×20", "12+12", "1:30", "400 m". */
function footerValue(t: LiveTask): string {
  if (t.roundsConfig?.length) {
    const seq = t.roundsConfig.map((r) => r.work).join("/");
    return t.type === "time" ? `${seq} mp` : seq;
  }
  if (t.type === "reps") {
    const reps = t.perSide ? `${t.targetReps}+${t.targetReps}` : `${t.targetReps}`;
    return t.rounds > 1 ? `${t.rounds}×${t.targetReps}` : reps;
  }
  if (t.type === "time" || t.type === "rest") return formatSeconds(t.targetSeconds ?? 0);
  if (t.resultKind === "reps") return "60 mp";
  return t.targetDistanceMeters ? `${t.targetDistanceMeters} m` : "stopper";
}

function Ring({ fraction, color }: { fraction: number; color: string }) {
  const offset = RING_CIRCUMFERENCE * Math.min(1, Math.max(0, fraction));
  return (
    <svg viewBox="0 0 100 100" width={236} height={236} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={50} cy={50} r={45} fill="none" stroke="var(--color-border)" strokeWidth={3} />
      <circle
        cx={50}
        cy={50}
        r={45}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

function RoundPips({ round, rounds, color }: { round: number; rounds: number; color: string }) {
  return (
    <div className="flex justify-center gap-1.5">
      {Array.from({ length: rounds }, (_, i) => (
        <span
          key={i}
          className="h-[5px] w-[26px] rounded-[3px]"
          style={{ background: i < round - 1 ? color : "var(--color-border-strong)" }}
        />
      ))}
    </div>
  );
}

const secondaryBtn =
  "flex-1 rounded-[9px] border border-border-strong bg-bg-inset px-4 py-3.5 text-[14px] font-medium text-text";
const primaryBtn =
  "flex-1 rounded-[9px] border-0 bg-text px-4 py-3.5 text-[14px] font-medium text-bg";

/**
 * Runs a single task's round/rest/timer state. Mounted with `key={task.id}` by
 * the parent so state resets for free whenever the task actually changes.
 */
function TaskRunner({
  task,
  onComplete,
}: {
  task: LiveTask;
  onComplete: (result: TaskResult) => void;
}) {
  const hasRing = task.type !== "reps" && !(task.type === "stopwatch" && task.resultKind === "time");
  const isTimedRound =
    task.type === "time" || task.type === "rest" || (task.type === "stopwatch" && task.resultKind === "reps");
  // A task with a custom per-round schedule can have a different work
  // duration/rep count in every round, so this is a function of the round
  // rather than a single constant.
  const durationMsFor = (r: number) =>
    task.type === "time" || task.type === "rest"
      ? workForRound(task, r) * 1000
      : task.resultKind === "reps"
        ? 60_000
        : 0;

  const [round, setRound] = useState(1);
  const [phase, setPhase] = useState<"active" | "resting" | "awaiting-input">("active");
  const [running, setRunning] = useState(isTimedRound);
  const [remainingMs, setRemainingMs] = useState(() => durationMsFor(1));
  const [repsInput, setRepsInput] = useState("");

  const [swPhase, setSwPhase] = useState<"idle" | "running" | "stopped">("idle");
  const [elapsedMs, setElapsedMs] = useState(0);

  const advanceAfterRound = () => {
    if (round < task.rounds) {
      const rest = restAfterRound(task, round);
      if (rest) {
        setPhase("resting");
        setRunning(true);
        setRemainingMs(rest * 1000);
      } else {
        setRound((r) => r + 1);
        setRemainingMs(durationMsFor(round + 1));
        setRunning(isTimedRound);
      }
    } else if (task.type === "stopwatch" && task.resultKind === "reps") {
      setRunning(false);
      setPhase("awaiting-input");
    } else {
      onComplete(task.type === "reps" ? { resultReps: workForRound(task, round) || undefined } : {});
    }
  };

  // Countdown tick — drives both the active timed round and the rest interval.
  useEffect(() => {
    if (!isTimedRound && phase !== "resting") return;
    if (!running) return;
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
        if (phase === "resting") {
          setRound((r) => r + 1);
          setPhase("active");
          setRemainingMs(durationMsFor(round + 1));
          setRunning(isTimedRound);
        } else {
          advanceAfterRound();
        }
        return 0;
      });
    }, 100);
    return () => clearInterval(interval);
    // `round` is a dependency on purpose: it forces a fresh interval (with a
    // fresh `advanceAfterRound` closure) after every round transition, even
    // when `running`/`phase` end up back at the same value (e.g. round N+1
    // starts running immediately with no rest) — otherwise the old closure's
    // stale `round` would never see the updated round count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase, round]);

  // Open-ended stopwatch tick (counts up).
  useEffect(() => {
    if (task.type !== "stopwatch" || task.resultKind === "reps" || swPhase !== "running") return;
    const interval = setInterval(() => setElapsedMs((prev) => prev + 100), 100);
    return () => clearInterval(interval);
  }, [swPhase, task.type, task.resultKind]);

  function skipOrFinishRound() {
    playTransitionChime();
    if (phase === "resting") {
      setRound((r) => r + 1);
      setPhase("active");
      setRemainingMs(durationMsFor(round + 1));
      setRunning(isTimedRound);
    } else {
      setRunning(false);
      advanceAfterRound();
    }
  }

  // ---- Rest interstitial (mockup 2e) ----
  if (phase === "resting") {
    const restSeconds = restAfterRound(task, round) ?? 1;
    const nextTaskLabel = task.rounds > 1 ? `KÖVETKEZIK · ${round + 1}. KÖR` : "KÖVETKEZIK";
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4.5 px-6 py-6 text-center">
        <div className="mono text-[11px] tracking-[0.04em] text-success">PIHENŐ</div>
        <div className="relative h-[236px] w-[236px]">
          <Ring fraction={1 - remainingMs / (restSeconds * 1000)} color="#4ea36a" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="mono text-[52px] font-light leading-none tracking-[-0.03em] text-[#8fe0ab]">
              {formatCountdown(remainingMs)}
            </div>
            <div className="mono text-[11px] text-text-faint">{restSeconds} MP SZÜNET</div>
          </div>
        </div>
        <div className="text-center">
          <div className="mono mb-2 text-[11px] text-text-faint">{nextTaskLabel}</div>
          <div className="mb-2 text-[20px] font-medium tracking-[-0.02em]">
            {task.name}
            {task.type === "reps" ? ` · ${workForRound(task, round + 1)} db` : ""}
          </div>
          <RoundPips round={round + 1} rounds={task.rounds} color="#4ea36a" />
        </div>
        <div className="flex w-full gap-2.5">
          <button
            onClick={() => setRemainingMs((prev) => prev + 20_000)}
            className={secondaryBtn}
          >
            +20 mp
          </button>
          <button onClick={skipOrFinishRound} className={cn(primaryBtn, "flex-[1.4]")}>
            Pihenő átugrása
          </button>
        </div>
      </div>
    );
  }

  // ---- AMRAP reps entry (after the 60s countdown ends) ----
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
      </div>
    );
  }

  // ---- Active round ----
  const isRest = task.type === "rest";
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4.5 px-6 py-6 text-center">
      <div className={cn("mono text-[11px] tracking-[0.04em]", isRest ? "text-success" : "text-warning")}>
        {task.type === "reps"
          ? "ISMÉTLÉSES FELADAT"
          : isRest
            ? "PIHENŐ"
            : task.type === "stopwatch" && task.resultKind === "time"
              ? "STOPPERES FELADAT"
              : "IDŐZÍTETT FELADAT"}
      </div>

      {hasRing && (
        <div className="relative h-[236px] w-[236px]">
          <Ring
            fraction={durationMsFor(round) ? 1 - remainingMs / durationMsFor(round) : 0}
            color={isRest ? "#4ea36a" : "#e0b341"}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="mono text-[52px] font-light leading-none tracking-[-0.03em]">
              {formatCountdown(remainingMs)}
            </div>
            <div className="mono text-[11px] text-text-faint">
              {task.type === "time" || isRest
                ? `${formatSeconds(workForRound(task, round))}-BÓL`
                : "60 MP-BŐL"}
            </div>
          </div>
        </div>
      )}

      {task.type === "reps" && (
        <div className="mono text-[72px] font-light leading-none tracking-[-0.03em]">
          {task.perSide
            ? `${workForRound(task, round)}+${workForRound(task, round)}`
            : workForRound(task, round)}
        </div>
      )}

      {task.type === "stopwatch" && task.resultKind === "time" && (
        <div className="mono text-[72px] font-light leading-none tracking-[-0.03em]">
          {formatClock(elapsedMs)}
        </div>
      )}

      <div>
        {task.rounds > 1 && (
          <div className="mb-2.5">
            <RoundPips round={round} rounds={task.rounds} color="#e0b341" />
          </div>
        )}
        <div className="mb-1.5 text-[20px] font-medium tracking-[-0.02em]">{task.name}</div>
        {task.note && <div className="text-[12.5px] leading-[1.4] text-text-muted">{task.note}</div>}
      </div>

      {task.type === "time" || isRest || (task.type === "stopwatch" && task.resultKind === "reps") ? (
        <div className="flex w-full gap-2.5">
          <button
            onClick={() => setRemainingMs(durationMsFor(round))}
            className="w-[52px] flex-none rounded-[9px] border border-border-strong bg-transparent text-[13px] font-medium text-text-secondary"
          >
            ↺
          </button>
          <button onClick={() => setRunning((r) => !r)} className={secondaryBtn}>
            {running ? "Szünet" : "Folytatás"}
          </button>
          <button onClick={skipOrFinishRound} className={primaryBtn}>
            Kész
          </button>
        </div>
      ) : task.type === "reps" ? (
        <button onClick={skipOrFinishRound} className={cn(primaryBtn, "w-full flex-none")}>
          Kész
        </button>
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
    </div>
  );
}

export function FocusSession({
  sessionId,
  workoutName,
  tasks,
  completedTaskIds,
}: {
  sessionId: string;
  workoutName: string;
  tasks: LiveTask[];
  completedTaskIds: string[];
}) {
  const [isPending, startTransition] = useTransition();

  const initialIndex = useMemo(() => {
    const done = new Set(completedTaskIds);
    const idx = tasks.findIndex((t) => !done.has(t.id));
    return idx === -1 ? tasks.length : idx;
  }, [tasks, completedTaskIds]);

  const [index, setIndex] = useState(initialIndex);
  const task = tasks[index] as LiveTask | undefined;

  // Always starts counting from 0 at mount — a resumed/stale in-progress
  // session's real `startedAt` can be far in the past, which used to make
  // this show a wildly inflated elapsed time on load.
  const [elapsedTotalMs, setElapsedTotalMs] = useState(0);
  useEffect(() => {
    const mountedAt = Date.now();
    const interval = setInterval(() => {
      setElapsedTotalMs(Date.now() - mountedAt);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (index >= tasks.length) {
      startTransition(() => {
        completeSessionAction(sessionId);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function handleComplete(result: TaskResult) {
    const finishedTask = task!;
    startTransition(async () => {
      await completeTaskAction({ sessionId, taskId: finishedTask.id, ...result });
      if (index + 1 >= tasks.length) {
        await completeSessionAction(sessionId);
      } else {
        toast(`${finishedTask.name} kész`, "success");
        setIndex((i) => i + 1);
      }
    });
  }

  function quit() {
    if (!confirm("Biztosan megszakítod az edzést? A haladásod nem lesz kész.")) return;
    toast("Edzés megszakítva", "info");
    startTransition(() => abandonSessionAction(sessionId));
  }

  if (!task) {
    return <div className="flex min-h-screen items-center justify-center text-text-muted">Mentés…</div>;
  }

  const progressPct = Math.round((index / tasks.length) * 100);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col">
      <div className="flex items-center justify-between px-5 pb-3 pt-3.5">
        <span className="mono text-[11px] text-text-muted">
          {workoutName.toUpperCase()} · {index + 1}/{tasks.length}
        </span>
        <span className="mono text-[11px] text-text-muted">
          ELTELT {formatSeconds(elapsedTotalMs / 1000)}
        </span>
      </div>
      <div className="h-[3px] bg-border">
        <div className="h-[3px] bg-text transition-[width]" style={{ width: `${progressPct}%` }} />
      </div>

      <TaskRunner key={task.id} task={task} onComplete={handleComplete} />

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto border-t border-border px-5 pb-2 pt-4">
        <div className="mono mb-0.5 text-[10.5px] text-text-faint">FELADATOK</div>
        {tasks.map((t, i) => {
          const isDone = i < index;
          const isCurrent = i === index;
          if (isDone) {
            return (
              <div key={t.id} className="flex items-center gap-2.75 text-[12.5px] text-[#5f5f5f]">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success-bg text-[9px] text-success">
                  ✓
                </span>
                <span className="flex-1 truncate line-through">{t.name}</span>
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
          Edzés megszakítása
        </button>
      </div>
    </div>
  );
}
