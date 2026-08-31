"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Input } from "@/components/ui/input";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-list";
import { isoDaysAgo } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { AdminUserRow } from "@/lib/admin-data";

type Filter = "all" | "active" | "inactive";
type LevelFilter = "all" | number;

export function AdminUserList({ rows }: { rows: (AdminUserRow & { inactive: boolean })[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");

  const counts = useMemo(
    () => ({
      all: rows.length,
      active: rows.filter((r) => !r.inactive).length,
      inactive: rows.filter((r) => r.inactive).length,
    }),
    [rows]
  );

  const stats = useMemo(() => {
    const last7 = isoDaysAgo(7);
    const newThisWeek = rows.filter((r) => r.createdAt >= last7).length;
    const trainedToday = rows.filter((r) => r.daysInactive === 0).length;
    const avgProgress =
      rows.length > 0
        ? Math.round(
            (rows.reduce((s, r) => s + (r.totalCount > 0 ? r.doneCount / r.totalCount : 0), 0) / rows.length) * 100
          )
        : 0;
    return { newThisWeek, trainedToday, avgProgress };
  }, [rows]);

  const levels = useMemo(
    () => Array.from(new Set(rows.map((r) => r.currentLevelIndex))).sort((a, b) => a - b),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "active" && r.inactive) return false;
      if (filter === "inactive" && !r.inactive) return false;
      if (levelFilter !== "all" && r.currentLevelIndex !== levelFilter) return false;
      if (q && !r.name.toLowerCase().includes(q) && !r.email.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, query, filter, levelFilter]);

  const filterTabs: [Filter, string][] = [
    ["all", `Mind · ${counts.all}`],
    ["active", `Aktív · ${counts.active}`],
    ["inactive", `Inaktív · ${counts.inactive}`],
  ];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="grid grid-cols-2 gap-2 px-5 pt-3.5 md:flex md:gap-2.5 xl:px-7 xl:pt-4.5">
        <div className="rounded-[12px] border border-border bg-bg-inset p-4">
          <div className="mono text-[19px] font-medium tracking-[-0.02em] xl:text-[22px]">{counts.active}</div>
          <div className="mono mt-2.25 text-[10px] text-text-faint">AKTÍV FIÓK</div>
        </div>
        <div className="hidden rounded-[12px] border border-border bg-bg-inset p-4 md:block">
          <div className="mono text-[19px] font-medium tracking-[-0.02em] xl:text-[22px]">{stats.newThisWeek}</div>
          <div className="mono mt-2.25 text-[10px] text-text-faint">ÚJ EZEN A HÉTEN</div>
        </div>
        <div className="hidden rounded-[12px] border border-border bg-bg-inset p-4 md:block">
          <div className="mono text-[19px] font-medium tracking-[-0.02em] xl:text-[22px]">{stats.avgProgress}%</div>
          <div className="mono mt-2.25 text-[10px] text-text-faint">ÁTLAGOS HALADÁS</div>
        </div>
        <div className="rounded-[12px] border border-border bg-bg-inset p-4">
          <div className="mono text-[19px] font-medium tracking-[-0.02em] xl:text-[22px]">{stats.trainedToday}</div>
          <div className="mono mt-2.25 text-[10px] text-text-faint">MA EDZETT</div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-5 pt-3.5 xl:flex-row xl:items-center xl:px-7 xl:py-4.5">
        <Input
          placeholder="Keresés név vagy e-mail szerint"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="xl:max-w-[330px]"
        />
        <select
          value={levelFilter === "all" ? "all" : String(levelFilter)}
          onChange={(e) => setLevelFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="rounded-[9px] border border-border-strong bg-bg-inset px-3.25 py-2 text-[12.5px] font-medium text-text outline-none"
        >
          <option value="all">Minden szint</option>
          {levels.map((l) => (
            <option key={l} value={l}>
              Szint {l}
            </option>
          ))}
        </select>
        <div className="flex gap-1.5">
          {filterTabs.map(([key, label]) => (
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

      {/* Mobile/tablet card list */}
      <StaggerContainer className="flex flex-1 flex-col gap-2 overflow-y-auto px-5 py-4 xl:hidden">
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

      {/* Desktop table */}
      <div className="hidden flex-1 flex-col overflow-hidden px-7 pb-6 xl:flex">
        <div className="flex flex-1 flex-col overflow-hidden rounded-[12px] border border-border bg-bg-inset">
          <div className="mono grid grid-cols-[1.6fr_1fr_0.9fr_0.8fr_90px] gap-4 border-b border-border px-5 py-3 text-[10px] tracking-[0.06em] text-text-faint">
            <span>FELHASZNÁLÓ</span>
            <span>HALADÁS</span>
            <span>SZINT</span>
            <span>UTOLSÓ EDZÉS</span>
            <span />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="py-8 text-center text-[13px] text-text-muted">Nincs találat.</p>
            )}
            {filtered.map((r) => {
              const pct = r.totalCount > 0 ? Math.round((r.doneCount / r.totalCount) * 100) : 0;
              const lastActiveLabel =
                r.daysInactive === null
                  ? "—"
                  : r.daysInactive === 0
                    ? "MA"
                    : r.daysInactive === 1
                      ? "TEGNAP"
                      : `${r.daysInactive} NAPJA`;
              return (
                <Link
                  key={r.id}
                  href={`/admin/users/${r.id}`}
                  className={cn(
                    "grid grid-cols-[1.6fr_1fr_0.9fr_0.8fr_90px] items-center gap-4 border-t border-border px-5 py-3.5",
                    r.isBanned && "opacity-60"
                  )}
                >
                  <div className="flex items-center gap-2.75 overflow-hidden">
                    <Avatar name={r.name} size={30} />
                    <div className="overflow-hidden">
                      <div className="truncate text-[13.5px]">{r.name}</div>
                      <div className="mono mt-1.5 truncate text-[10px] text-text-faint">{r.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="h-1.25 flex-1 rounded-full bg-border">
                      <div
                        className={cn("h-1.25 rounded-full", r.inactive ? "bg-text-faint" : "bg-text-secondary")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="mono w-9 text-[11px] text-text-muted">{pct}%</span>
                  </div>
                  <span className="mono text-[11px] text-text-muted">SZINT {r.currentLevelIndex}</span>
                  <span className="mono text-[11px] text-text-faint">{lastActiveLabel}</span>
                  <span className="mono justify-self-end rounded-[7px] border border-border-strong px-2.75 py-1.5 text-[11.5px] font-medium text-text-secondary">
                    Részletek
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
