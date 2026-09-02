"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { formatSeconds } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Ring } from "@/components/ring";
import { IconX, IconPlay, IconPause } from "@/components/icons";
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
  index,
  total,
  onComplete,
  onRoundChange,
}: {
  task: LiveTask;
  index: number;
  total: number;
  onComplete: (result: TaskResult) => void;
  /** Reports the task's current round so the parent header can show "N. KÖR" for multi-round tasks. */
  onRoundChange: (round: number, rounds: number) => void;
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

  useEffect(() => {
    onRoundChange(round, task.rounds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, task.rounds]);

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
  // Only decrements state; deliberately has no side effects of its own. It
  // used to also fire the round/rest transition (chime, advancing
  // round/phase) from inside this same setState updater, but an updater
  // function must stay pure — React (in Strict Mode/dev) can and does
  // invoke it twice to check for exactly that, which replayed the
  // transition twice back to back and could eat a whole rest period in one
  // go (or skip it outright). See the effect below for the transition.
  useEffect(() => {
    if (!isTimedRound && phase !== "resting") return;
    if (!running) return;
    const interval = setInterval(() => {
      setRemainingMs((prev) => Math.max(0, prev - 100));
    }, 100);
    return () => clearInterval(interval);
  }, [running, phase, round]);

  // Beep once as the displayed countdown ticks over to 3, 2, and 1.
  const prevRemainingRef = useRef(remainingMs);
  useEffect(() => {
    const prev = prevRemainingRef.current;
    prevRemainingRef.current = remainingMs;
    if (!running || remainingMs > prev) return; // ignore resets/rewinds
    const prevSec = Math.ceil(prev / 1000);
    const nextSec = Math.ceil(remainingMs / 1000);
    if (nextSec !== prevSec && nextSec >= 1 && nextSec <= 3) playCountdownBeep();
  }, [remainingMs, running]);

  // Fires the round/rest transition exactly once when the countdown reaches
  // zero. `firedForRef` guards against running it twice for the same
  // phase+round (Strict Mode's double-effect-invocation in dev, or any other
  // duplicate render) and is cleared whenever remainingMs goes back above
  // zero (manual restart) so a genuine second countdown can still fire it.
  const firedForRef = useRef<string | null>(null);
  useEffect(() => {
    if (remainingMs > 0) {
      firedForRef.current = null;
      return;
    }
    if (!running) return;
    if (!isTimedRound && phase !== "resting") return;
    const key = `${phase}-${round}`;
    if (firedForRef.current === key) return;
    firedForRef.current = key;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs, running, phase, round]);

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
  const ordinalLabel = isRest ? "PIHENŐ" : `FELADAT ${index + 1} / ${total}`;
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4.5 px-6 py-6 text-center">
      {!hasRing && (
        <div
          className={cn("mono text-[10.5px] tracking-[0.06em]", isRest ? "text-success" : "text-text-faint")}
        >
          {ordinalLabel}
        </div>
      )}

      {hasRing && (
        <div className="relative h-[236px] w-[236px]">
          <Ring
            fraction={durationMsFor(round) ? 1 - remainingMs / durationMsFor(round) : 0}
            color={isRest ? "#4ea36a" : "#e0b341"}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div
              className={cn(
                "mono text-[10.5px] tracking-[0.06em]",
                isRest ? "text-success" : "text-text-faint"
              )}
            >
              {ordinalLabel}
            </div>
            <div className="mono text-[52px] font-light leading-none tracking-[-0.03em]">
              {formatCountdown(remainingMs)}
            </div>
            {(task.type === "time" || isRest) && (
              <div className="mono text-[11px] text-text-faint">
                {formatSeconds(workForRound(task, round))}-BÓL
              </div>
            )}
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
        <div className="mb-1.5 text-[20px] font-medium tracking-[-0.02em]">{task.name}</div>
        {task.note && <div className="text-[12.5px] leading-[1.4] text-text-muted">{task.note}</div>}
      </div>

      {task.type === "time" || isRest || (task.type === "stopwatch" && task.resultKind === "reps") ? (
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => setRemainingMs(durationMsFor(round))}
            aria-label="Újraindítás"
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-border-strong text-[15px] font-medium text-text-muted"
          >
            ↺
          </button>
          <button
            onClick={() => setRunning((r) => !r)}
            aria-label={running ? "Szünet" : "Folytatás"}
            className="flex h-[78px] w-[78px] shrink-0 items-center justify-center rounded-full border-0 bg-text text-bg"
          >
            {running ? <IconPause width={22} height={22} /> : <IconPlay width={22} height={22} />}
          </button>
          <button
            onClick={skipOrFinishRound}
            aria-label="Kész"
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-border-strong text-[19px] font-medium text-text-muted"
          >
            ›
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

/** Task rows for the always-visible list — shared by the mobile toggle panel and the desktop side panel. */
function TaskListRows({ tasks, index }: { tasks: LiveTask[]; index: number }) {
  return (
    <>
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
    </>
  );
}

export function FocusSession({
  sessionId,
  workoutName,
  levelIndex,
  tasks,
  completedTaskIds,
}: {
  sessionId: string;
  workoutName: string;
  levelIndex: number;
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

  // The current task's round, reported by TaskRunner — shown in the header
  // subtitle for multi-round tasks (e.g. "SZINT 2 · 2. KÖR").
  const [round, setRound] = useState({ round: 1, rounds: 1 });
  const [showAllTasks, setShowAllTasks] = useState(false);

  // Always starts counting from 0 at mount — a resumed/stale in-progress
  // session's real `startedAt` can be far in the past, which used to make
  // this show a wildly inflated elapsed time on load. Only shown on the
  // desktop side panel; not worth ticking a re-render for on mobile.
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

  const nextTask = tasks[index + 1] as LiveTask | undefined;

  return (
    <div className="flex min-h-screen w-full xl:justify-center">
    <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col md:max-w-[640px] xl:mx-0">
      <div className="flex items-center justify-between px-5 pb-2.5 pt-3.5">
        <button
          onClick={quit}
          disabled={isPending}
          aria-label="Edzés megszakítása"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-border-strong text-text-muted"
        >
          <IconX width={13} height={13} />
        </button>
        <div className="text-center">
          <div className="text-[13px] font-medium">{workoutName}</div>
          <div className="mono mt-1 text-[10px] tracking-[0.02em] text-text-faint">
            SZINT {levelIndex}
            {round.rounds > 1 ? ` · ${round.round}. KÖR` : ""}
          </div>
        </div>
        <button
          onClick={() => setShowAllTasks((v) => !v)}
          aria-label="Feladatlista"
          aria-expanded={showAllTasks}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-border-strong text-[15px] text-text-muted md:invisible md:pointer-events-none"
        >
          ⋯
        </button>
      </div>

      <div className="flex gap-1.25 px-5 pb-1">
        {tasks.map((t, i) => (
          <span
            key={t.id}
            className={cn("h-[3px] flex-1 rounded-full", i < index ? "bg-success" : i === index ? "bg-text" : "bg-border-strong")}
          />
        ))}
      </div>

      <TaskRunner
        key={task.id}
        task={task}
        index={index}
        total={tasks.length}
        onComplete={handleComplete}
        onRoundChange={(r, rounds) => setRound({ round: r, rounds })}
      />

      {nextTask ? (
        <div className="flex items-center gap-3 border-t border-border bg-bg-inset px-5 py-4 md:hidden">
          <span className="mono flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] border border-border-strong bg-bg-elevated text-[11px] text-text-faint">
            {index + 2}
          </span>
          <div className="min-w-0 flex-1 text-left">
            <div className="mono mb-1.5 text-[10px] text-text-faint">KÖVETKEZIK</div>
            <div className="truncate text-[13px] font-medium">{nextTask.name}</div>
          </div>
          <span className="mono shrink-0 text-[11px] text-text-faint">{footerValue(nextTask)}</span>
        </div>
      ) : (
        <div className="border-t border-border bg-bg-inset px-5 py-4 text-center text-[12px] text-text-faint md:hidden">
          Utolsó feladat
        </div>
      )}

      {showAllTasks && (
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto border-t border-border px-5 pb-4 pt-4 md:hidden">
          <div className="mono mb-0.5 text-[10.5px] text-text-faint">FELADATOK</div>
          <TaskListRows tasks={tasks} index={index} />
        </div>
      )}

      {/* Tablet task list — always visible below the timer, no toggle needed. */}
      <div className="hidden flex-1 flex-col gap-2 overflow-y-auto border-t border-border px-6 pb-5 pt-4 md:flex xl:hidden">
        <div className="mono mb-0.5 flex items-center justify-between text-[10.5px] text-text-faint">
          <span>FELADATOK</span>
          <span>
            ELTELT {formatSeconds(elapsedTotalMs / 1000)} · {tasks.length - index} FELADAT HÁTRA
          </span>
        </div>
        <TaskListRows tasks={tasks} index={index} />
      </div>
    </div>

    {/* Desktop task panel — always visible, no toggle needed at this width. */}
    <div className="hidden w-[400px] shrink-0 flex-col border-l border-border bg-bg-inset xl:flex">
      <div className="border-b border-border px-6 py-5">
        <div className="text-[15px] font-medium">Feladatok</div>
        <div className="mono mt-2 text-[11px] text-text-faint">
          ELTELT {formatSeconds(elapsedTotalMs / 1000)} · {tasks.length - index} FELADAT HÁTRA
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-6 py-4">
        <TaskListRows tasks={tasks} index={index} />
      </div>
    </div>
    </div>
  );
}
