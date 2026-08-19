"use client";

import { useActionState, useEffect } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast-store";
import { createLevelAction, updateLevelAction } from "@/app/admin/plans/actions";
import type { Level } from "@/db/schema";

export function LevelForm({ level }: { level?: Level }) {
  const action = level ? updateLevelAction : createLevelAction;
  const [state, formAction, pending] = useActionState(action, undefined);

  useEffect(() => {
    if (state?.success) toast("Szint mentve", "success");
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      {level && <input type="hidden" name="levelId" value={level.id} />}
      <label className="flex flex-col gap-1.5">
        <Label>Név</Label>
        <Input name="name" defaultValue={level?.name} placeholder="pl. Alapok" required />
      </label>
      <label className="flex flex-col gap-1.5">
        <Label>Leírás</Label>
        <Input name="description" defaultValue={level?.description ?? ""} placeholder="Opcionális" />
      </label>
      {state?.error && <p className="text-[12.5px] text-danger">{state.error}</p>}
      <Button type="submit" size="lg" disabled={pending} className="mt-1">
        {pending ? "Mentés…" : level ? "Mentés" : "Szint létrehozása"}
      </Button>
    </form>
  );
}
