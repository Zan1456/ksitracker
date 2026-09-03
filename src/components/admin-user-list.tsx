"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Input } from "@/components/ui/input";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-list";
import { cn } from "@/lib/cn";
import type { AdminUserRow } from "@/lib/admin-data";

export function AdminUserList({ rows }: { rows: (AdminUserRow & { inactive: boolean })[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="px-5.5 pt-1.5">
        <Input
          placeholder="Keresés név vagy e-mail szerint"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <StaggerContainer className="flex flex-1 flex-col gap-2.25 overflow-y-auto px-5.5 py-4">
        {filtered.length === 0 && (
          <p className="py-6 text-center text-[13px] font-semibold text-white/60">Nincs találat.</p>
        )}
        {filtered.map((r) => {
          const pct = r.totalCount > 0 ? Math.round((r.doneCount / r.totalCount) * 100) : 0;
          return (
            <StaggerItem key={r.id}>
              <Link
                href={`/admin/users/${r.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-[22px] border border-white/15 bg-white/8 p-4 transition-transform active:scale-[0.98]",
                  r.isBanned && "opacity-60"
                )}
              >
                <Avatar name={r.name} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="mb-1.75 flex items-center gap-1.75">
                    <span className="truncate text-[13.5px] font-bold">{r.name}</span>
                    {r.isBanned ? (
                      <span className="mono shrink-0 text-[9.5px] font-bold text-danger">TILTVA</span>
                    ) : r.inactive ? (
                      <span className="mono shrink-0 text-[9.5px] font-semibold text-white/50">
                        {r.daysInactive !== null ? `${r.daysInactive} NAPJA INAKTÍV` : "MÉG NEM AKTÍV"}
                      </span>
                    ) : (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 flex-1 rounded-full bg-white/18">
                      <span
                        className={cn("block h-1.5 rounded-full", r.inactive ? "bg-white/40" : "bg-accent")}
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                    <span className="mono text-[10.5px] font-semibold text-white/70">
                      {r.doneCount}/{r.totalCount}
                    </span>
                  </div>
                </div>
                <span className="text-[14px] text-white/40">›</span>
              </Link>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </div>
  );
}
