"use client";

import { useActionState, useEffect } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast-store";
import { createWorkoutAction, updateWorkoutAction } from "@/app/admin/plans/actions";
import type { Workout } from "@/db/schema";

export function WorkoutForm({ workout, levelId }: { workout?: Workout; levelId?: string }) {
  const action = workout ? updateWorkoutAction : createWorkoutAction.bind(null, levelId!);
  const [state, formAction, pending] = useActionState(action, undefined);

  useEffect(() => {
    if (state?.success) toast("Edzés mentve", "success");
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      {workout && <input type="hidden" name="workoutId" value={workout.id} />}
      <label className="flex flex-col gap-1.5">
        <Label>Név</Label>
        <Input name="name" defaultValue={workout?.name} placeholder="pl. Felsőtest erő" required />
      </label>
      <label className="flex flex-col gap-1.5">
        <Label>Leírás</Label>
        <Input name="description" defaultValue={workout?.description ?? ""} placeholder="Opcionális" />
      </label>
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1.5">
          <Label>Nehézség</Label>
          <select
            name="difficulty"
            defaultValue={workout?.difficulty ?? "medium"}
            className="box-border w-full rounded-lg border border-border-strong bg-bg-inset px-3.5 py-3.5 text-sm text-text outline-none focus:border-accent-strong"
          >
            <option value="easy">Könnyű</option>
            <option value="medium">Közepes</option>
            <option value="hard">Nehéz</option>
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1.5">
          <Label>Becsült perc</Label>
          <Input
            name="estimatedMinutes"
            type="number"
            min={1}
            max={180}
            defaultValue={workout?.estimatedMinutes ?? 20}
            required
          />
        </label>
      </div>
      {state?.error && <p className="text-[12.5px] text-danger">{state.error}</p>}
      <Button type="submit" size="lg" disabled={pending} className="mt-1">
        {pending ? "Mentés…" : workout ? "Mentés" : "Edzés létrehozása"}
      </Button>
    </form>
  );
}
