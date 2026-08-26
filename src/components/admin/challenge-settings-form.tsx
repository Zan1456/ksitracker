"use client";

import { useActionState, useEffect } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast-store";
import { updateChallengeSettingsAction } from "@/app/admin/plans/challenge-actions";

export function ChallengeSettingsForm({ minRequired, taskCount }: { minRequired: number; taskCount: number }) {
  const [state, formAction, pending] = useActionState(updateChallengeSettingsAction, undefined);

  useEffect(() => {
    if (state?.success) toast("Beállítás mentve", "success");
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex items-end gap-2.5">
        <label className="flex flex-1 flex-col gap-1.5">
          <Label>Minimum ennyi challenge-feladatot kell teljesíteni ({taskCount} van összesen)</Label>
          <Input name="minRequired" type="number" min={1} max={Math.max(taskCount, 1)} defaultValue={minRequired} required />
        </label>
        <Button type="submit" size="md" disabled={pending}>
          {pending ? "Mentés…" : "Mentés"}
        </Button>
      </div>
      {state?.error && <p className="text-[12.5px] text-danger">{state.error}</p>}
    </form>
  );
}
