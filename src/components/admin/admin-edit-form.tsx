"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast-store";
import { useConfirm } from "@/components/confirm-dialog";
import type { AdminPermissions } from "@/db/schema";
import { createAdminAction, updateAdminAction, deleteAdminAction, type AdminEditState } from "@/app/admin/admins/actions";
import { PERM_KEYS } from "@/lib/admin-permissions";

type ExistingAdmin = {
  id: string;
  name: string;
  email: string;
  adminPermissions: AdminPermissions | null;
  isDefaultAdmin: boolean;
};

const DEFAULT_PERMS: AdminPermissions = { users: true, workouts: true, stats: true, admins: false };

export function AdminEditForm({ admin, canDelete }: { admin: ExistingAdmin | null; canDelete: boolean }) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const action = admin ? updateAdminAction : createAdminAction;
  const [state, formAction, pending] = useActionState<AdminEditState, FormData>(action, undefined);

  const [role, setRole] = useState<"primary" | "admin">(admin && !admin.adminPermissions ? "primary" : "admin");
  const [perms, setPerms] = useState<AdminPermissions>(admin?.adminPermissions ?? DEFAULT_PERMS);

  async function onDelete() {
    if (!admin) return;
    if (!(await confirm(`${admin.name} admin fiókja és a hozzáférése törlődik.`))) return;
    toast(`${admin.name} törölve.`, "info");
    await deleteAdminAction(admin.id);
    router.push("/admin/admins");
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {admin && <input type="hidden" name="adminId" value={admin.id} />}
      <div className="flex flex-col gap-2.75">
        <Input type="text" name="name" placeholder="Név" defaultValue={admin?.name} required autoComplete="off" />
        <Input type="email" name="email" placeholder="E-mail" defaultValue={admin?.email} required autoComplete="off" />
        {!admin && (
          <Input type="password" name="password" placeholder="Jelszó (min. 8 karakter)" required minLength={8} />
        )}
      </div>

      <div className="rounded-[22px] border border-white/15 bg-white/8 p-4.5">
        <div className="mono mb-3 text-[10.5px] tracking-[0.14em] text-white/60">SZEREPKÖR</div>
        <div className="flex gap-1.75">
          {(["primary", "admin"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                "flex-1 rounded-[13px] py-3 text-center text-[12px] font-bold",
                role === r ? "bg-white text-brand-blue" : "bg-white/14 text-white/85"
              )}
            >
              {r === "primary" ? "Fő admin" : "Admin"}
            </button>
          ))}
        </div>
      </div>

      {role === "admin" && (
        <div className="overflow-hidden rounded-[22px] border border-white/15 bg-white/8">
          <div className="mono border-b border-white/8 px-4.5 py-3.75 text-[10.5px] tracking-[0.14em] text-white/60">
            JOGOSULTSÁGOK
          </div>
          {PERM_KEYS.map(([key, name]) => {
            const on = perms[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setPerms((p) => ({ ...p, [key]: !p[key] }))}
                className="flex w-full items-center gap-3 border-b border-white/8 px-4.5 py-3.75 text-left last:border-b-0"
              >
                <span className="flex-1 text-[13.5px] font-bold">{name}</span>
                <span
                  className={cn(
                    "flex h-6.75 w-11.5 shrink-0 items-center rounded-full p-0.75",
                    on ? "bg-accent justify-end" : "bg-white/22 justify-start"
                  )}
                >
                  <span className={cn("h-5.25 w-5.25 rounded-full", on ? "bg-[#0A0A0B]" : "bg-white")} />
                </span>
                <input type="hidden" name={`perm_${key}`} value={on ? "on" : ""} />
              </button>
            );
          })}
        </div>
      )}

      {state?.error && (
        <p className="rounded-2xl border border-danger-border bg-danger-bg px-4.5 py-3.25 text-[12.5px] font-semibold text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Mentés…" : "Mentés"}
      </Button>

      {admin && canDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="rounded-full border border-danger-border bg-danger-bg py-4 text-[13.5px] font-bold text-danger"
        >
          Admin fiók törlése
        </button>
      )}
      {dialog}
    </form>
  );
}
