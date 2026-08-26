"use client";

import { useActionState, useEffect, useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast-store";
import { createTaskAction, updateTaskAction } from "@/app/admin/plans/actions";
import type { WorkoutTask } from "@/db/schema";

type TaskType = "reps" | "time";

/** One row of the custom per-round work/rest editor. */
type RoundRow = { work: number; rest: string };

function buildInitialRoundRows(task: WorkoutTask | undefined, type: TaskType, rounds: number): RoundRow[] {
  if (task?.roundsConfig?.length) {
    return task.roundsConfig.map((r) => ({ work: r.work, rest: r.restSeconds != null ? String(r.restSeconds) : "" }));
  }
  const fallbackWork = type === "time" ? task?.targetSeconds ?? 30 : task?.targetReps ?? 10;
  const fallbackRest = task?.restSeconds ? String(task.restSeconds) : "";
  return Array.from({ length: Math.max(rounds, 1) }, () => ({ work: fallbackWork, rest: fallbackRest }));
}

export function TaskForm({
  task,
  workoutId,
  onSaved,
}: {
  task?: WorkoutTask;
  workoutId?: string;
  onSaved?: () => void;
}) {
  const action = task ? updateTaskAction : createTaskAction.bind(null, workoutId!);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [type, setType] = useState<TaskType>((task?.type as TaskType) ?? "reps");
  const [rounds, setRounds] = useState(task?.rounds ?? 1);
  const [customRounds, setCustomRounds] = useState(!!task?.roundsConfig?.length);
  const [roundRows, setRoundRows] = useState<RoundRow[]>(() => buildInitialRoundRows(task, type, rounds));

  useEffect(() => {
    if (state?.success) {
      toast(task ? "Feladat mentve" : "Feladat hozzáadva", "success");
      onSaved?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Keep the per-round rows in sync with the round count without clobbering
  // values the admin already typed for the rows that still exist.
  function handleRoundsChange(value: number) {
    const nextRounds = Math.max(1, value || 1);
    setRounds(nextRounds);
    setRoundRows((prev) => {
      if (prev.length === nextRounds) return prev;
      const next = prev.slice(0, nextRounds);
      const last = prev[prev.length - 1];
      while (next.length < nextRounds) next.push(last ? { ...last } : { work: 10, rest: "" });
      return next;
    });
  }

  function updateRoundRow(i: number, patch: Partial<RoundRow>) {
    setRoundRows((prev) => prev.map((row, ri) => (ri === i ? { ...row, ...patch } : row)));
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {task && <input type="hidden" name="taskId" value={task.id} />}

      <div className="flex gap-2.5">
        <label className="flex flex-[1.4] flex-col gap-1.5">
          <Label>Név</Label>
          <Input name="name" defaultValue={task?.name} placeholder="pl. Fekvőtámasz" required />
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
          <Label>Típus</Label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as TaskType)}
            className="box-border w-full rounded-lg border border-border-strong bg-bg-inset px-3 py-3.5 text-sm text-text outline-none focus:border-accent-strong"
          >
            <option value="reps">Ismétlés</option>
            <option value="time">Idő</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <Label>Leírás</Label>
        <Input
          name="note"
          defaultValue={task?.note ?? ""}
          placeholder="Opcionális, pl. hogyan kell helyesen végezni"
        />
      </label>

      {type === "reps" && (
        <div className="flex items-end gap-2.5">
          <label className="flex flex-1 flex-col gap-1.5">
            <Label>Ismétlés</Label>
            <Input
              name="targetReps"
              type="number"
              min={1}
              defaultValue={task?.targetReps ?? 10}
              required
            />
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <Label>Körök</Label>
            <Input
              name="rounds"
              type="number"
              min={1}
              max={20}
              value={rounds}
              onChange={(e) => handleRoundsChange(Number(e.target.value))}
            />
          </label>
          <label className="mb-3.5 flex items-center gap-1.75 text-[12.5px] text-text-secondary">
            <input type="checkbox" name="perSide" defaultChecked={task?.perSide} />
            oldalanként
          </label>
        </div>
      )}

      {type === "time" && (
        <div className="flex items-end gap-2.5">
          <label className="flex flex-1 flex-col gap-1.5">
            <Label>Időtartam (mp)</Label>
            <Input
              name="targetSeconds"
              type="number"
              min={1}
              defaultValue={task?.targetSeconds ?? 30}
              required
            />
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <Label>Körök</Label>
            <Input
              name="rounds"
              type="number"
              min={1}
              max={20}
              value={rounds}
              onChange={(e) => handleRoundsChange(Number(e.target.value))}
            />
          </label>
        </div>
      )}

      {rounds > 1 && (
        <label className="flex items-center gap-1.75 text-[12.5px] text-text-secondary">
          <input
            type="checkbox"
            name="customRounds"
            checked={customRounds}
            onChange={(e) => setCustomRounds(e.target.checked)}
          />
          Egyedi körök — köröként eltérő {type === "time" ? "idő" : "ismétlés"}/pihenő arány (pl. 30-30, majd 35-25)
        </label>
      )}

      {rounds > 1 && customRounds && (
        <div className="flex flex-col gap-1.75 rounded-lg border border-border-strong bg-bg-inset p-2.5">
          {roundRows.map((row, i) => (
            <div key={i} className="flex items-center gap-1.75">
              <span className="mono w-5 shrink-0 text-[11px] text-text-faint">{i + 1}.</span>
              <label className="flex flex-1 flex-col gap-1">
                <span className="text-[10.5px] text-text-faint">{type === "time" ? "Idő (mp)" : "Ism."}</span>
                <Input
                  name="roundWork"
                  type="number"
                  min={1}
                  value={row.work}
                  onChange={(e) => updateRoundRow(i, { work: Number(e.target.value) || 1 })}
                />
              </label>
              <label className="flex flex-1 flex-col gap-1">
                <span className="text-[10.5px] text-text-faint">Pihenő ez után (mp)</span>
                <Input
                  name="roundRest"
                  type="number"
                  min={0}
                  placeholder="nincs"
                  value={row.rest}
                  onChange={(e) => updateRoundRow(i, { rest: e.target.value })}
                />
              </label>
            </div>
          ))}
        </div>
      )}

      {rounds > 1 && !customRounds && (
        <label className="flex flex-col gap-1.5">
          <Label>Pihenő körök között (mp) — üresen hagyva nincs pihenő</Label>
          <Input
            name="restSeconds"
            type="number"
            min={1}
            max={600}
            defaultValue={task?.roundsConfig?.length ? "" : task?.restSeconds ?? ""}
          />
        </label>
      )}

      {state?.error && <p className="text-[12.5px] text-danger">{state.error}</p>}
      <Button type="submit" size="md" disabled={pending} className="mt-1">
        {pending ? "Mentés…" : task ? "Mentés" : "Feladat hozzáadása"}
      </Button>
    </form>
  );
}
