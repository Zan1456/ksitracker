"use client";

import { useState, useTransition } from "react";
import { updateAdminNoteAction } from "@/app/admin/actions";

export function AdminNoteField({ userId, initialNote }: { userId: string; initialNote: string | null }) {
  const [value, setValue] = useState(initialNote ?? "");
  const [, startTransition] = useTransition();

  return (
    <div className="rounded-[22px] border border-white/15 bg-white/8 p-4.5">
      <div className="mono mb-3 text-[10.5px] tracking-[0.14em] text-white/60">ADMIN JEGYZET</div>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => startTransition(() => updateAdminNoteAction(userId, value))}
        placeholder="Jegyzet a taghoz"
        className="box-border w-full rounded-2xl border border-white/20 bg-white/12 px-4 py-3.25 text-[13px] font-semibold text-white outline-none placeholder:text-white/40 focus:border-accent"
      />
    </div>
  );
}
