"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Input } from "@/components/ui/input";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-list";
import { cn } from "@/lib/cn";
import type { AdminUserRow } from "@/lib/admin-data";

type Filter = "all" | "active" | "inactive";

export function AdminUserList({ rows }: { rows: (AdminUserRow & { inactive: boolean })[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(
    () => ({
      all: rows.length,
      active: rows.filter((r) => !r.inactive).length,
      inactive: rows.filter((r) => r.inactive).length,
    }),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "active" && r.inactive) return false;
      if (filter === "inactive" && !r.inactive) return false;
      if (q && !r.name.toLowerCase().includes(q) && !r.email.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, query, filter]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-col gap-2.5 px-5 pt-3.5">
        <Input
          placeholder="Keresés név vagy e-mail szerint"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex gap-1.5">
          {(
            [
              ["all", `Mind · ${counts.all}`],
              ["active", `Aktív · ${counts.active}`],
              ["inactive", `Inaktív · ${counts.inactive}`],
            ] as [Filter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "whitespace-nowrap rounded-full px-2.75 py-1.75 text-[11.5px] font-medium",
                filter === key
                  ? "bg-text text-bg"
                  : "border border-border-strong bg-bg-inset text-text-secondary"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <StaggerContainer className="flex flex-1 flex-col gap-2 overflow-y-auto px-5 py-4">
        {filtered.length === 0 && (
          <p className="py-6 text-center text-[13px] text-text-muted">Nincs találat.</p>
        )}
        {filtered.map((r) => {
          const pct = r.totalCount > 0 ? Math.round((r.doneCount / r.totalCount) * 100) : 0;
          return (
            <StaggerItem key={r.id}>
            <Link
              href={`/admin/users/${r.id}`}
              className={cn(
                "flex items-center gap-3 rounded-[10px] border border-border bg-bg-elevated p-3.25 transition-transform active:scale-[0.98]",
                r.isBanned && "opacity-60"
              )}
            >
              <Avatar name={r.name} size={32} />
              <div className="flex-1 overflow-hidden">
                <div className="mb-1.75 flex items-center gap-1.75">
                  <span className="truncate text-[13px] font-medium">{r.name}</span>
                  {r.isBanned ? (
                    <span className="mono shrink-0 text-[10px] text-danger">TILTVA</span>
                  ) : r.inactive ? (
                    <span className="mono shrink-0 text-[10px] text-text-muted">
                      {r.daysInactive !== null ? `${r.daysInactive} NAPJA INAKTÍV` : "MÉG NEM AKTÍV"}
                    </span>
                  ) : (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 flex-1 rounded-full bg-border">
                    <div
                      className={cn("h-1 rounded-full", r.inactive ? "bg-text-faint" : "bg-text")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="mono text-[10.5px] text-text-muted">
                    {r.doneCount}/{r.totalCount}
                  </span>
                </div>
              </div>
              <span className="text-[14px] text-text-faint">›</span>
            </Link>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </div>
  );
}
