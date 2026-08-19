"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { IconPause, IconPlay, IconX, IconStopwatch } from "@/components/icons";
import { completeTaskAction, completeSessionAction, abandonSessionAction } from "@/app/workout/actions";

type LiveTask = {
  id: string;
  name: string;
  note: string | null;
  type: "reps" | "time" | "stopwatch";
  targetReps: number | null;
  targetSeconds: number | null;
  targetDistanceMeters: number | null;
  resultKind: "time" | "reps" | null;
  rankDirection: "asc" | "desc" | null;
  rounds: number;
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

const bigButtonClass =
  "flex h-[150px] w-[150px] flex-col items-center justify-center gap-2 rounded-full border border-border-strong bg-bg-inset text-[15px] font-medium hover:border-text-faint";

/**
 * Runs a single task's timer/stopwatch logic. Mounted with `key={task.id}` by
 * the parent so every field of state below resets for free on task change —
 * no "sync state to prop" effect required.
 */
function TaskRunner({
  task,
  workoutName,
  onComplete,
}: {
  task: LiveTask;
  workoutName: string;
  onComplete: (result: TaskResult) => void;
}) {
  const [round, setRound] = useState(1);
  const [running, setRunning] = useState(task.type === "time"); // time tasks auto-start
  const [remainingMs, setRemainingMs] = useState(task.targetSeconds ? task.targetSeconds * 1000 : 0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [swPhase, setSwPhase] = useState<"idle" | "running" | "stopped">("idle");
  const [repsInput, setRepsInput] = useState("");
  const [amrapDone, setAmrapDone] = useState(false);

  const isCountdownTask = task.type === "time" || (task.type === "stopwatch" && task.resultKind === "reps");

  // Countdown tick (time-hold tasks and the 60s AMRAP stopwatch variant). Reaching
  // zero is handled right inside the interval callback so no extra effect is needed.
  useEffect(() => {
    if (!isCountdownTask || !running) return;
    const interval = setInterval(() => {
      setRemainingMs((prev) => {
        const next = prev - 100;
        if (next > 0) return next;

        clearInterval(interval);
        if (task.type === "time") {
          setRound((r) => {
            if (r < task.rounds) {
              setTimeout(() => {
                setRemainingMs(task.targetSeconds ? task.targetSeconds * 1000 : 0);
                setRunning(true);
              }, 400);
              return r + 1;
            }
            setRunning(false);
            onComplete({});
            return r;
          });
        } else {
          setRunning(false);
          setAmrapDone(true);
        }
        return 0;
      });
    }, 100);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, isCountdownTask]);

  // Stopwatch tick (counts up) for open-ended stopwatch tasks.
  useEffect(() => {
    if (task.type !== "stopwatch" || task.resultKind === "reps" || swPhase !== "running") return;
    const interval = setInterval(() => setElapsedMs((prev) => prev + 100), 100);
    return () => clearInterval(interval);
  }, [swPhase, task.type, task.resultKind]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-8 text-center">
      <div className="mono text-[11px] tracking-[0.08em] text-text-muted">
        {task.type === "time" && task.rounds > 1 ? `${round}. KÖR` : " "}
      </div>

      {task.type === "reps" && (
        <>
          <div className="text-[15px] text-text-muted">{workoutName}</div>
          <div className="mono text-[72px] font-light leading-none tracking-[-0.04em]">
            {task.rounds > 1 ? `${task.rounds}×` : ""}
            {task.targetReps ?? "-"}
          </div>
          <div>
            <div className="mb-2 text-[23px] font-medium tracking-[-0.02em]">{task.name}</div>
            {task.note && <div className="text-[13px] text-text-muted">{task.note}</div>}
          </div>
          <button
            onClick={() => onComplete({ resultReps: task.targetReps ?? undefined })}
            className={bigButtonClass}
          >
            Kész
          </button>
        </>
      )}

      {task.type === "time" && (
        <>
          <div className="text-center">
            <div className="mono text-[104px] font-light leading-none tracking-[-0.05em]">
              {formatCountdown(remainingMs)}
            </div>
            <div className="mx-auto mt-4.5 h-[3px] w-[190px] rounded-full bg-border">
              <div
                className="h-[3px] rounded-full bg-text transition-[width]"
                style={{
                  width: `${task.targetSeconds ? 100 - (remainingMs / (task.targetSeconds * 1000)) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
          <div>
            <div className="mb-2 text-[23px] font-medium tracking-[-0.02em]">{task.name}</div>
            {task.note && <div className="text-[13px] text-text-muted">{task.note}</div>}
          </div>
          <button onClick={() => setRunning((r) => !r)} className={bigButtonClass}>
            {running ? <IconPause width={16} height={16} /> : <IconPlay width={16} height={16} />}
            {running ? "Szünet" : "Indítás"}
          </button>
          <button
            onClick={() => onComplete({})}
            className="text-[12px] text-text-faint underline underline-offset-2"
          >
            Feladat befejezése
          </button>
        </>
      )}

      {task.type === "stopwatch" && task.resultKind !== "reps" && (
        <>
          <div className="mono text-[88px] font-light leading-none tracking-[-0.04em]">
            {formatClock(elapsedMs)}
          </div>
          <div>
            <div className="mb-2 text-[23px] font-medium tracking-[-0.02em]">{task.name}</div>
            <div className="text-[13px] text-text-muted">
              {task.targetDistanceMeters ? `${task.targetDistanceMeters} m` : "saját stopper"} ·{" "}
              {task.rankDirection === "desc" ? "minél tovább, annál jobb" : "minél gyorsabb, annál jobb"}
            </div>
          </div>

          {swPhase !== "stopped" ? (
            <button
              onClick={() => setSwPhase((p) => (p === "running" ? "idle" : "running"))}
              className={bigButtonClass}
            >
              <IconStopwatch width={20} height={20} />
              {swPhase === "running" ? "Szünet" : "Indítás"}
            </button>
          ) : (
            <div className="text-[13px] text-text-muted">Eredmény rögzítve ennyi idővel:</div>
          )}

          {swPhase === "running" && (
            <button
              onClick={() => setSwPhase("stopped")}
              className="text-[12px] text-text-faint underline underline-offset-2"
            >
              Állj — véglegesítés
            </button>
          )}
          {swPhase === "stopped" && (
            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setSwPhase("idle");
                  setElapsedMs(0);
                }}
                className="rounded-lg border border-border-strong px-4 py-3 text-[13px] text-text-secondary"
              >
                Újra
              </button>
              <button
                onClick={() => onComplete({ resultMs: elapsedMs })}
                className="rounded-lg bg-text px-5 py-3 text-[13px] font-medium text-bg"
              >
                Mentés és tovább
              </button>
            </div>
          )}
        </>
      )}

      {task.type === "stopwatch" && task.resultKind === "reps" && (
        <>
          {!amrapDone ? (
            <>
              <div className="mono text-[104px] font-light leading-none tracking-[-0.05em]">
                {formatCountdown(remainingMs)}
              </div>
              <div>
                <div className="mb-2 text-[23px] font-medium tracking-[-0.02em]">{task.name}</div>
                {task.note && <div className="text-[13px] text-text-muted">{task.note}</div>}
              </div>
              <button onClick={() => setRunning((r) => !r)} className={bigButtonClass}>
                {running ? <IconPause width={16} height={16} /> : <IconPlay width={16} height={16} />}
                {running ? "Szünet" : "Indítás"}
              </button>
            </>
          ) : (
            <>
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
                onClick={() => onComplete({ resultReps: Number(repsInput) })}
                className="rounded-lg bg-text px-6 py-3.5 text-[14px] font-medium text-bg disabled:opacity-50"
              >
                Mentés és tovább
              </button>
            </>
          )}
        </>
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

  // If every task was already completed (e.g. resumed after a refresh), finish the session.
  useEffect(() => {
    if (index >= tasks.length) {
      startTransition(() => {
        completeSessionAction(sessionId);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function handleComplete(result: TaskResult) {
    startTransition(async () => {
      await completeTaskAction({ sessionId, taskId: task!.id, ...result });
      if (index + 1 >= tasks.length) {
        await completeSessionAction(sessionId);
      } else {
        setIndex((i) => i + 1);
      }
    });
  }

  function quit() {
    if (!confirm("Biztosan kilépsz? Az edzés nem lesz kész.")) return;
    startTransition(() => abandonSessionAction(sessionId));
  }

  if (!task) {
    return (
      <div className="flex min-h-screen items-center justify-center text-text-muted">Mentés…</div>
    );
  }

  const remainingTasks = tasks.length - index - 1;
  const nextTask = tasks[index + 1];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col">
      <div className="flex items-center justify-between px-5 pb-0 pt-3.5">
        <button
          onClick={quit}
          disabled={isPending}
          className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border text-text-muted"
        >
          <IconX width={14} height={14} />
        </button>
        <span className="mono text-[11px] tracking-[0.08em] text-text-faint">FÓKUSZ MÓD</span>
        <span className="w-[30px]" />
      </div>

      <div className="mono px-6 pt-2 text-center text-[11px] tracking-[0.08em] text-text-muted">
        FELADAT {index + 1} / {tasks.length}
      </div>

      <TaskRunner key={task.id} task={task} workoutName={workoutName} onComplete={handleComplete} />

      {nextTask && (
        <div className="border-t border-border bg-bg-inset px-5 pb-4 pt-3.5">
          <div className="mb-1.5 flex items-center gap-2.5">
            <span className="mono text-[10.5px] text-text-faint">HÁTRALÉVŐ</span>
            <span className="h-px flex-1 bg-border" />
            <span className="mono text-[10.5px] text-text-faint">{remainingTasks} FELADAT</span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 rounded-[9px] border border-border-strong bg-bg-elevated p-3">
              <div className="mb-1.5 text-[12.5px] font-medium">{nextTask.name}</div>
              <div className="mono text-[10.5px] text-warning">MOST KÖVETKEZIK</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
