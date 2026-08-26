"use client";

import { useActionState, useEffect } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast-store";
import { createChallengeTaskAction, updateChallengeTaskAction } from "@/app/admin/plans/challenge-actions";
import type { ChallengeTask } from "@/db/schema";

export function ChallengeTaskForm({ task, onSaved }: { task?: ChallengeTask; onSaved?: () => void }) {
  const action = task ? updateChallengeTaskAction : createChallengeTaskAction;
  const [state, formAction, pending] = useActionState(action, undefined);

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

      <label className="flex flex-col gap-1.5">
        <Label>Név</Label>
        <Input name="name" defaultValue={task?.name} placeholder="pl. Sprint 400 m" required />
      </label>

      <label className="flex flex-col gap-1.5">
        <Label>Leírás</Label>
        <Input
          name="note"
          defaultValue={task?.note ?? ""}
          placeholder="Opcionális, pl. hogyan kell helyesen végezni"
        />
      </label>

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

      {state?.error && <p className="text-[12.5px] text-danger">{state.error}</p>}
      <Button type="submit" size="md" disabled={pending} className="mt-1">
        {pending ? "Mentés…" : task ? "Mentés" : "Feladat hozzáadása"}
      </Button>
    </form>
  );
}
