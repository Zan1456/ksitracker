"use client";

import { useActionState, useEffect, useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast-store";
import { createTaskAction, updateTaskAction } from "@/app/admin/plans/actions";
import type { WorkoutTask } from "@/db/schema";

type TaskType = "reps" | "time" | "stopwatch";

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
  const [type, setType] = useState<TaskType>(task?.type ?? "reps");
  const [rounds, setRounds] = useState(task?.rounds ?? 1);

  useEffect(() => {
    if (state?.success) {
      toast(task ? "Feladat mentve" : "Feladat hozzáadva", "success");
      onSaved?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

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
            <option value="stopwatch">Stopper</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <Label>Megjegyzés</Label>
        <Input name="note" defaultValue={task?.note ?? ""} placeholder="pl. 90 fokos szög" />
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
              onChange={(e) => setRounds(Number(e.target.value) || 1)}
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
              onChange={(e) => setRounds(Number(e.target.value) || 1)}
            />
          </label>
        </div>
      )}

      {(type === "reps" || type === "time") && rounds > 1 && (
        <label className="flex flex-col gap-1.5">
          <Label>Pihenő körök között (mp) — üresen hagyva nincs pihenő</Label>
          <Input
            name="restSeconds"
            type="number"
            min={1}
            max={600}
            defaultValue={task?.restSeconds ?? ""}
          />
        </label>
      )}

      {type === "stopwatch" && (
        <>
          <div className="flex gap-2.5">
            <label className="flex flex-1 flex-col gap-1.5">
              <Label>Táv (m) — opcionális</Label>
              <Input
                name="targetDistanceMeters"
                type="number"
                min={1}
                defaultValue={task?.targetDistanceMeters ?? ""}
              />
            </label>
            <label className="flex flex-1 flex-col gap-1.5">
              <Label>Eredmény típusa</Label>
              <select
                name="resultKind"
                defaultValue={task?.resultKind ?? "time"}
                className="box-border w-full rounded-lg border border-border-strong bg-bg-inset px-3 py-3.5 text-sm text-text outline-none"
              >
                <option value="time">Idő</option>
                <option value="reps">Ismétlésszám</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <Label>Rangsorolás</Label>
            <select
              name="rankDirection"
              defaultValue={task?.rankDirection ?? "asc"}
              className="box-border w-full rounded-lg border border-border-strong bg-bg-inset px-3.5 py-3.5 text-sm text-text outline-none"
            >
              <option value="asc">Minél kisebb, annál jobb (pl. sprint idő)</option>
              <option value="desc">Minél nagyobb, annál jobb (pl. plank idő, ismétlésszám)</option>
            </select>
          </label>
        </>
      )}

      {state?.error && <p className="text-[12.5px] text-danger">{state.error}</p>}
      <Button type="submit" size="md" disabled={pending} className="mt-1">
        {pending ? "Mentés…" : task ? "Mentés" : "Feladat hozzáadása"}
      </Button>
    </form>
  );
}
