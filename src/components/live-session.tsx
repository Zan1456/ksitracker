"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast-store";
import { formatSeconds } from "@/lib/format";
import { playCountdownBeep, playTransitionChime } from "@/lib/sound";
import { useConfirm } from "@/components/confirm-dialog";
import { IconX } from "@/components/icons";

const REST_SECONDS = 45;

export type LiveTask = {
  id: string;
  name: string;
  meta: string;
  /** Only workout tasks carry these — challenge tasks are always stopwatch-style. */
  type?: "reps" | "time" | "stopwatch" | "rest";
  targetSeconds?: number | null;
  rounds?: number;
  roundsConfig?: { work: number; restSeconds: number | null }[] | null;
  restSeconds?: number | null;
};

function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** How many rounds a task has — `roundsConfig` (per-round overrides) wins when set. */
function totalRounds(t: LiveTask): number {
  return t.roundsConfig?.length || t.rounds || 1;
}

/** The active round's target duration, in seconds. */
function roundTargetSeconds(t: LiveTask, roundIdx: number): number {
  return t.roundsConfig?.[roundIdx]?.work ?? t.targetSeconds ?? 0;
}

/** Rest *after* the given round, before the next one — null means none. */
function roundRestSeconds(t: LiveTask, roundIdx: number): number | null {
  return t.roundsConfig?.[roundIdx]?.restSeconds ?? t.restSeconds ?? null;
}

/**
 * The Repline live-session engine, shared by workouts and challenges: one
 * continuous stopwatch runs for the whole session (used for lap timing and
 * leaderboard results), while a "time" task additionally drives its own
 * round countdown — auto-advancing through rounds and into the next task
 * without waiting on a tap. Reps/stopwatch tasks keep the tap-to-complete
 * flow (there's no fixed duration to count down from). Rest *between tasks*
 * is the user's own opt-in setting (`autoRestEnabled`); rest *between
 * rounds* of the same timed task is authored on the task itself and always
 * applies.
 */
export function LiveSession({
  title,
  kicker,
  tasks,
  initialCompletedTaskIds,
  startedAt,
  autoRestEnabled,
  soundEnabled,
  onCompleteTask,
  onFinish,
  onAbandon,
}: {
  title: string;
  kicker: string;
  tasks: LiveTask[];
  initialCompletedTaskIds: string[];
  /** ISO timestamp the session was created — the stopwatch's origin on resume. */
  startedAt: string;
  autoRestEnabled: boolean;
  soundEnabled: boolean;
  onCompleteTask: (taskId: string, resultMs: number) => Promise<void>;
  onFinish: () => Promise<void>;
  onAbandon: () => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();
  const { confirm, dialog } = useConfirm();

  const [doneIds, setDoneIds] = useState<Set<string>>(() => new Set(initialCompletedTaskIds));
  const [taskIdx, setTaskIdx] = useState(initialCompletedTaskIds.length);
  const [laps, setLaps] = useState<Record<string, number>>({});

  // Lazy initializer: React calls this once, on mount, to seed state — the
  // sanctioned place for a one-off impure read like `Date.now()` (used here
  // to resume the stopwatch from real elapsed wall-clock time instead of
  // restarting it at 0 on reload).
  const [elapsedMs, setElapsedMs] = useState(() => Math.max(0, Date.now() - new Date(startedAt).getTime()));
  const [running, setRunning] = useState(true);
  const [resting, setResting] = useState(false);
  const [restMs, setRestMs] = useState(0);
  const lastLapMsRef = useRef(elapsedMs);

  const task = tasks[taskIdx];
  const allDone = taskIdx >= tasks.length;
  // Narrowed (not just a boolean) so the helpers below can take it directly
  // without TypeScript losing track of the undefined check.
  const timedTask = task && task.type === "time" ? task : null;
  const isTimedTask = !!timedTask;

  // Which round of the current (timed) task is active, and its own countdown.
  const [roundIdx, setRoundIdx] = useState(0);
  const [remainingMs, setRemainingMs] = useState(() => (timedTask ? roundTargetSeconds(timedTask, 0) * 1000 : 0));
  // What the rest banner should do once it hits zero: nothing extra (a
  // between-*task* rest — the task index already moved on), or advance to
  // the next round of the same task (a between-*round* rest).
  const restEndActionRef = useRef<"none" | "next-round">("none");

  // Reset round + countdown when the task changes, and re-arm the countdown
  // when just the round changes within the same task — done during render
  // (React's sanctioned way to adjust state in response to a prop/derived
  // value change) rather than in an Effect, which would cost an extra
  // render round-trip and trip the no-setState-in-effect lint rule.
  const [prevTaskIdx, setPrevTaskIdx] = useState(taskIdx);
  if (taskIdx !== prevTaskIdx) {
    setPrevTaskIdx(taskIdx);
    setRoundIdx(0);
    setRemainingMs(timedTask ? roundTargetSeconds(timedTask, 0) * 1000 : 0);
  }
  const [prevRoundIdx, setPrevRoundIdx] = useState(roundIdx);
  if (roundIdx !== prevRoundIdx) {
    setPrevRoundIdx(roundIdx);
    setRemainingMs(timedTask ? roundTargetSeconds(timedTask, roundIdx) * 1000 : 0);
  }

  const elapsedRef = useRef(elapsedMs);
  const restRef = useRef(restMs);
  const remainingRef = useRef(remainingMs);
  useEffect(() => {
    elapsedRef.current = elapsedMs;
  }, [elapsedMs]);
  useEffect(() => {
    restRef.current = restMs;
  }, [restMs]);
  useEffect(() => {
    remainingRef.current = remainingMs;
  }, [remainingMs]);

  // Single combined tick, mirroring the drift-safe pattern used by the rest
  // of the app's timers: arithmetic goes through refs, not a functional
  // setState updater, so nothing here can be affected by React re-invoking
  // an impure updater (Strict Mode/dev).
  useEffect(() => {
    if (!running && !resting) return;
    const interval = setInterval(() => {
      if (resting) {
        const prev = restRef.current;
        const next = prev - 100;
        const prevSec = Math.ceil(prev / 1000);
        const nextSec = Math.ceil(Math.max(0, next) / 1000);
        if (soundEnabled && nextSec !== prevSec && nextSec >= 1 && nextSec <= 3) playCountdownBeep();
        if (next > 0) {
          restRef.current = next;
          setRestMs(next);
          return;
        }
        restRef.current = 0;
        setRestMs(0);
        setResting(false);
        if (soundEnabled) playTransitionChime();
        if (restEndActionRef.current === "next-round") {
          restEndActionRef.current = "none";
          setRoundIdx((r) => r + 1);
        }
        return;
      }
      if (!running) return;

      if (timedTask) {
        const prev = remainingRef.current;
        const next = prev - 100;
        const prevSec = Math.ceil(prev / 1000);
        const nextSec = Math.ceil(Math.max(0, next) / 1000);
        if (soundEnabled && nextSec !== prevSec && nextSec >= 1 && nextSec <= 3) playCountdownBeep();
        if (next > 0) {
          remainingRef.current = next;
          setRemainingMs(next);
        } else {
          remainingRef.current = 0;
          setRemainingMs(0);
          const rounds = totalRounds(timedTask);
          if (roundIdx + 1 < rounds) {
            const rest = roundRestSeconds(timedTask, roundIdx);
            if (soundEnabled) playTransitionChime();
            if (rest && rest > 0) {
              restEndActionRef.current = "next-round";
              setResting(true);
              setRestMs(rest * 1000);
            } else {
              setRoundIdx((r) => r + 1);
            }
          } else {
            completeCurrent();
          }
        }
      }

      const nextElapsed = elapsedRef.current + 100;
      elapsedRef.current = nextElapsed;
      setElapsedMs(nextElapsed);
    }, 100);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, resting, soundEnabled, isTimedTask, taskIdx, roundIdx]);

  function completeCurrent() {
    if (isPending || !task) return;
    const cumulative = elapsedRef.current;
    const durationMs = Math.max(0, cumulative - lastLapMsRef.current);
    lastLapMsRef.current = cumulative;
    setDoneIds((prev) => new Set(prev).add(task.id));
    setLaps((prev) => ({ ...prev, [task.id]: cumulative }));
    if (soundEnabled) playTransitionChime();
    else toast(`${task.name} kész · ${formatClock(cumulative)}`, "success");

    const isLast = taskIdx + 1 >= tasks.length;
    startTransition(async () => {
      await onCompleteTask(task.id, durationMs);
      if (isLast) {
        setRunning(false);
        await onFinish();
      }
    });

    if (!isLast) {
      setTaskIdx((i) => i + 1);
      if (autoRestEnabled) {
        restEndActionRef.current = "none";
        setResting(true);
        setRestMs(REST_SECONDS * 1000);
      }
    }
  }

  function skipRest() {
    setResting(false);
    setRestMs(0);
    if (restEndActionRef.current === "next-round") {
      restEndActionRef.current = "none";
      setRoundIdx((r) => r + 1);
    }
  }

  async function quit() {
    if (!(await confirm(`Biztosan megszakítod ${kicker === "KIHÍVÁS" ? "a kihívást" : "az edzést"}? A haladásod nem lesz kész.`)))
      return;
    toast(`${kicker === "KIHÍVÁS" ? "Kihívás" : "Edzés"} megszakítva`, "info");
    startTransition(onAbandon);
  }

  const doneCount = doneIds.size;
  const progressPct = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;
  const roundTargetMs = timedTask ? roundTargetSeconds(timedTask, roundIdx) * 1000 : 0;
  const countdownPct = roundTargetMs > 0 ? Math.max(0, Math.min(100, (remainingMs / roundTargetMs) * 100)) : 0;
  const rounds = timedTask ? totalRounds(timedTask) : 1;
  const isSkip = resting || (isTimedTask && !allDone && taskIdx + 1 < tasks.length);
  const primaryLabel = resting
    ? "Kihagyás"
    : allDone
      ? "Mentés…"
      : taskIdx + 1 >= tasks.length
        ? "Befejezés"
        : isSkip
          ? "Kihagyás"
          : "Kész";

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[520px] flex-col text-white">
      <div className="flex items-center justify-between px-5.5 pb-3 pt-4">
        <div>
          <div className="text-[17px] font-extrabold leading-[1.1]">{title}</div>
          <div className="mono mt-2 text-[10.5px] tracking-[0.12em] text-white/65">
            {kicker} · {doneCount}/{tasks.length}
          </div>
        </div>
        <button
          onClick={quit}
          disabled={isPending}
          aria-label="Megszakítás"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/16"
        >
          <IconX width={14} height={14} strokeWidth={2} />
        </button>
      </div>

      <div className="px-5.5 pb-3.5">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/18">
          <div className="h-1.5 rounded-full bg-accent transition-[width]" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5.5">
        <div className="overflow-hidden rounded-[24px] border border-white/15 bg-white/8">
          {tasks.map((t, i) => {
            const isDone = doneIds.has(t.id);
            const isCur = i === taskIdx && !isDone;
            const lap = laps[t.id];
            const showCountdown = isCur && t.type === "time";
            return (
              <button
                key={t.id}
                type="button"
                onClick={isCur ? completeCurrent : undefined}
                disabled={!isCur}
                className={cn(
                  "flex w-full items-center gap-3.25 border-b border-white/8 p-4 text-left last:border-b-0",
                  isCur && "bg-accent/14",
                  !isCur && "cursor-default"
                )}
              >
                <span
                  className={cn(
                    "flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-[9px] border-[1.5px] text-[12px] font-extrabold text-[#0A0A0B]",
                    isDone ? "border-accent bg-accent" : "border-white/35 bg-transparent"
                  )}
                >
                  {isDone ? "✓" : ""}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block truncate text-[14px] font-bold", isDone ? "text-white/60" : "text-white")}>
                    {t.name}
                  </span>
                  <span className="mono mt-1.75 block text-[11px] tracking-[0.06em] text-white/55">{t.meta}</span>
                </span>
                <span className="mono shrink-0 text-[12px] font-semibold text-white/80">
                  {lap != null
                    ? formatClock(lap)
                    : showCountdown
                      ? formatSeconds(Math.ceil(remainingMs / 1000))
                      : isCur
                        ? "most"
                        : "—"}
                </span>
              </button>
            );
          })}
        </div>
        <div className="h-3.5" aria-hidden />
      </div>

      <div className="flex flex-col gap-3.5 border-t border-white/14 bg-white/8 px-5.5 py-5">
        {/* `relative` + the absolutely-positioned overlay below cover
            exactly this block (label, task name, big number, round badge,
            progress bar) — while resting you shouldn't see the timer at
            all, just the rest countdown, but the panel shouldn't jump in
            height when it appears/disappears. */}
        <div className="relative">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="mono mb-2 text-[10px] tracking-[0.14em] text-white/45">
                {isTimedTask ? "IDŐZÍTŐ" : "STOPPER"}
              </div>
              <div className="mb-3 truncate text-[20px] font-extrabold leading-[1.15] tracking-[-0.02em]">
                {allDone ? "Kész" : task?.name}
              </div>
              <div className="mono text-[50px] font-medium leading-none tracking-[-0.04em]">
                {isTimedTask ? formatSeconds(Math.ceil(remainingMs / 1000)) : formatClock(elapsedMs)}
              </div>
            </div>
            {isTimedTask && rounds > 1 && (
              <span className="mono shrink-0 rounded-full bg-accent px-3.5 py-2.25 text-[13px] font-extrabold text-accent-fg">
                {roundIdx + 1}/{rounds} KÖR
              </span>
            )}
          </div>

          {isTimedTask && (
            <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-white/18">
              <div
                className="h-1.5 rounded-full bg-accent transition-[width] duration-150 ease-linear"
                style={{ width: `${countdownPct}%` }}
              />
            </div>
          )}

          <AnimatePresence>
            {resting && (
              <motion.div
                key="resting-overlay"
                initial={{ opacity: 0, y: 44 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 44 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-[18px] bg-accent px-4.5 text-center text-[#0A0A0B]"
              >
                <span className="mono text-[38px] font-extrabold leading-none">{Math.ceil(restMs / 1000)}s</span>
                <span className="text-[12.5px] font-bold leading-[1.3]">
                  {restEndActionRef.current === "next-round"
                    ? `Pihenő — ${roundIdx + 2}. kör következik`
                    : `Pihenő — következik: ${task ? task.name : "befejezés"}`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-2.25">
          <button
            onClick={() => setRunning((r) => !r)}
            className="flex-1 rounded-full border border-white/28 bg-white/12 py-4 text-[14px] font-bold text-white"
          >
            {running ? "Szünet" : "Folytatás"}
          </button>
          <button
            onClick={resting ? skipRest : completeCurrent}
            disabled={isPending || allDone}
            className={cn(
              "flex-1 rounded-full py-4 text-[14px] font-extrabold disabled:opacity-60",
              isSkip ? "border border-white/30 bg-[#0A0A0B] text-white" : "bg-success text-[#0A0A0B]"
            )}
          >
            {primaryLabel}
          </button>
        </div>
      </div>

      {dialog}
    </div>
  );
}
