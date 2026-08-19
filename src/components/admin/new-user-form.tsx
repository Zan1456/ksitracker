"use client";

import { useActionState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createUserAction } from "@/app/admin/actions";

export function NewUserForm() {
  const [state, formAction, pending] = useActionState(createUserAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <label className="flex flex-col gap-1.5">
        <Label>Név</Label>
        <Input type="text" name="name" placeholder="Kovács Anna" required autoComplete="off" />
      </label>
      <label className="flex flex-col gap-1.5">
        <Label>E-mail</Label>
        <Input type="email" name="email" placeholder="nev@email.hu" required autoComplete="off" />
      </label>
      <label className="flex flex-col gap-1.5">
        <Label>Ideiglenes jelszó</Label>
        <Input type="text" name="password" required minLength={8} autoComplete="off" />
      </label>
      <label className="flex flex-col gap-1.5">
        <Label>Szerepkör</Label>
        <select
          name="role"
          defaultValue="user"
          className="box-border w-full rounded-lg border border-border-strong bg-bg-inset px-3.5 py-3.5 text-sm text-text outline-none focus:border-accent-strong focus:ring-2 focus:ring-accent-strong/20"
        >
          <option value="user">Felhasználó</option>
          <option value="admin">Admin</option>
        </select>
      </label>

      {state?.error && (
        <p className="rounded-lg border border-danger-border bg-danger-bg px-3.5 py-2.5 text-[12.5px] text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="mt-1">
        {pending ? "Létrehozás…" : "Felhasználó létrehozása"}
      </Button>
    </form>
  );
}
