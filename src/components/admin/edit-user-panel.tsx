"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast-store";
import { updateUserAction, resetPasswordAction, deleteUserAction } from "@/app/admin/actions";
import type { User } from "@/db/schema";

export function EditUserPanel({ user, isSelf }: { user: User; isSelf: boolean }) {
  const [open, setOpen] = useState(false);
  const [editState, editAction, editPending] = useActionState(updateUserAction, undefined);
  const [pwState, pwAction, pwPending] = useActionState(resetPasswordAction, undefined);
  const [deletePending, startDelete] = useTransition();

  useEffect(() => {
    if (editState?.success) toast("Adatok mentve", "success");
  }, [editState]);
  useEffect(() => {
    if (pwState?.success) toast("Jelszó frissítve", "success");
  }, [pwState]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-border py-2.75 text-center text-[12.5px] font-medium text-text-secondary transition-transform active:scale-[0.98]"
      >
        Adatok szerkesztése
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-[10px] border border-border p-3.75">
      <form action={editAction} className="flex flex-col gap-2.75">
        <input type="hidden" name="userId" value={user.id} />
        <Label>Név</Label>
        <Input name="name" defaultValue={user.name} required />
        <Label>E-mail</Label>
        <Input name="email" type="email" defaultValue={user.email} required />
        <Label>Szerepkör</Label>
        <select
          name="role"
          defaultValue={user.role}
          disabled={isSelf}
          className="box-border w-full rounded-lg border border-border-strong bg-bg-inset px-3.5 py-3 text-sm text-text outline-none disabled:opacity-50"
        >
          <option value="user">Felhasználó</option>
          <option value="admin">Admin</option>
        </select>
        {editState?.error && <p className="text-[12px] text-danger">{editState.error}</p>}
        <Button type="submit" size="sm" disabled={editPending} className="mt-1">
          {editPending ? "Mentés…" : "Mentés"}
        </Button>
      </form>

      <form action={pwAction} className="flex flex-col gap-2.75 border-t border-border pt-3.5">
        <Label>Új jelszó beállítása</Label>
        <Input name="password" type="text" minLength={8} placeholder="Legalább 8 karakter" required />
        <input type="hidden" name="userId" value={user.id} />
        {pwState?.error && <p className="text-[12px] text-danger">{pwState.error}</p>}
        <Button type="submit" variant="secondary" size="sm" disabled={pwPending}>
          {pwPending ? "Mentés…" : "Jelszó cseréje"}
        </Button>
      </form>

      {!isSelf && (
        <button
          disabled={deletePending}
          onClick={() => {
            if (!confirm(`Biztosan törlöd ${user.name} fiókját? Ez nem visszavonható.`)) return;
            toast(`${user.name} törölve`, "info");
            startDelete(() => deleteUserAction(user.id));
          }}
          className="border-t border-border pt-3.5 text-center text-[12.5px] font-medium text-danger disabled:opacity-50"
        >
          {deletePending ? "Törlés…" : "Felhasználó törlése"}
        </button>
      )}
    </div>
  );
}
