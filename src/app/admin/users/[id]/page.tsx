import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { getAdminUserDetail } from "@/lib/admin-data";
import { getHistory, getTotalStats } from "@/lib/workout-data";
import { formatMs, formatDateHu, formatHoursMinutes, relativeDayLabel } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { IconArrowLeft } from "@/components/icons";
import { cn } from "@/lib/cn";
import { PageTransition } from "@/components/motion/page-transition";
import { EditUserPanel } from "@/components/admin/edit-user-panel";
import { SessionHistoryList } from "@/components/admin/session-history-list";
import { toggleBanAction, resetDailyLimitAction } from "@/app/admin/actions";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  const [detail, history, totalStats] = await Promise.all([
    getAdminUserDetail(id),
    getHistory(id, 10),
    getTotalStats(id),
  ]);
  if (!detail) notFound();

  const { user, levelsProgress, doneCount, totalCount, rank, totalUsers, bestTimes, streakDays, hasBonusToday } =
    detail;
  const overallPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <AppShell nav="admin" wide>
      <div className="flex items-center gap-3 border-b border-border px-5 py-3.5 xl:hidden">
        <Link
          href="/admin"
          className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border text-text-secondary"
        >
          <IconArrowLeft width={15} height={15} />
        </Link>
        <span className="text-[13.5px] font-medium text-text-secondary">Felhasználók</span>
      </div>

      {/* Desktop header */}
      <div className="hidden items-center justify-between border-b border-border px-7 py-5 xl:flex">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[19px] font-medium tracking-[-0.02em]">{user.name}</span>
          </div>
          <div className="mono mt-2 text-[11px] text-text-faint">
            {user.email.toUpperCase()} · {user.isBanned ? "TILTVA" : "AKTÍV"} · CSATLAKOZOTT{" "}
            {formatDateHu(user.createdAt.toISOString().slice(0, 10))}
          </div>
        </div>
        <div className="flex gap-2.5">
          <Link
            href="/admin"
            className="flex items-center rounded-[8px] border border-border-strong px-3.5 py-2 text-[12.5px] font-medium text-text-secondary"
          >
            Vissza a listához
          </Link>
          <form action={toggleBanAction.bind(null, user.id, !user.isBanned)}>
            <button
              type="submit"
              className={cn(
                "rounded-[8px] border px-3.5 py-2 text-[12.5px] font-medium",
                user.isBanned ? "border-border-strong text-text-secondary" : "border-danger-border text-danger"
              )}
            >
              {user.isBanned ? "Tiltás feloldása" : "Fiók letiltása"}
            </button>
          </form>
        </div>
      </div>

      <PageTransition className="gap-5 overflow-y-auto px-5 pb-6 pt-4.5 xl:hidden">
        <div className="flex items-center gap-3.5">
          <Avatar name={user.name} size={46} />
          <div className="flex-1">
            <div className="text-[17px] font-medium tracking-[-0.02em]">{user.name}</div>
            <div className="mt-1 text-[11.5px] text-text-muted">
              {user.email} · reg. {formatDateHu(user.createdAt.toISOString().slice(0, 10))}
            </div>
          </div>
          {user.isBanned ? (
            <span className="mono shrink-0 rounded-[5px] border border-danger-border bg-danger-bg px-1.75 py-1.25 text-[10px] text-danger">
              TILTVA
            </span>
          ) : (
            <span className="mono shrink-0 rounded-[5px] border border-success-border bg-success-bg px-1.75 py-1.25 text-[10px] text-success">
              AKTÍV
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-[9px] border border-border p-3">
            <div className="mono mb-2 text-[10px] text-text-faint">KÉSZ</div>
            <div className="text-[16px] font-medium">
              {doneCount}
              <span className="text-[11px] text-text-faint">/{totalCount}</span>
            </div>
          </div>
          <div className="rounded-[9px] border border-border p-3">
            <div className="mono mb-2 text-[10px] text-text-faint">SOROZAT</div>
            <div className="text-[16px] font-medium">
              {streakDays} <span className="text-[11px] text-text-faint">nap</span>
            </div>
          </div>
          <div className="rounded-[9px] border border-border p-3">
            <div className="mono mb-2 text-[10px] text-text-faint">RANG</div>
            <div className="text-[16px] font-medium">
              #{rank}
              <span className="text-[11px] text-text-faint">/{totalUsers}</span>
            </div>
          </div>
        </div>

        <EditUserPanel user={user} isSelf={admin.id === user.id} />

        <div className="flex flex-col gap-2">
          <div className="mono text-[10.5px] text-text-faint">SZINTENKÉNTI KÉSZÜLTSÉG</div>
          {levelsProgress.map((l) => {
            const lPct = l.totalCount > 0 ? l.doneCount / l.totalCount : 0;
            const lDone = l.totalCount > 0 && l.doneCount === l.totalCount;
            const lMinutes = Math.round(l.workouts.reduce((s, w) => s + (w.bestSeconds ?? 0), 0) / 60);
            return (
              <div key={l.id} className="rounded-[10px] border border-border bg-bg-elevated p-3.25">
                <div className="mb-2.75 flex items-center justify-between">
                  <span className="text-[13px] font-medium">
                    Szint {l.index} · {l.name}
                  </span>
                  <span className="mono text-[10.5px] text-text-faint">
                    {l.locked ? "ZÁROLT · —" : `${l.doneCount}/${l.totalCount} EDZÉS · ${formatHoursMinutes(lMinutes)} Ó`}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-border">
                  <div
                    className={cn("h-1.5 rounded-full", l.locked ? "bg-text-faint" : lDone ? "bg-success" : "bg-accent")}
                    style={{ width: `${lPct * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-1">
          <div className="mono mb-1 text-[10.5px] text-text-faint">LEGJOBB IDŐK</div>
          {bestTimes.length === 0 && (
            <p className="py-2 text-[12.5px] text-text-muted">Nincs rögzített stopperes eredmény.</p>
          )}
          {bestTimes.map(({ category, row }) => (
            <div
              key={category.name}
              className="flex items-center gap-2.5 border-b border-border py-2.5 text-[12.5px]"
            >
              <span className="flex-1 text-text">{category.name}</span>
              <span className="mono text-[10.5px] text-text-faint">{row ? `#${row.rank}` : "—"}</span>
              <span className="mono font-medium">
                {row
                  ? category.resultKind === "time"
                    ? formatMs(row.value)
                    : `${row.value} ISM`
                  : "nincs"}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <div className="mono mb-1 text-[10.5px] text-text-faint">EDZÉSNAPLÓ</div>
          <SessionHistoryList userId={user.id} history={history} />
        </div>

        <div className="mt-auto flex gap-2.25 pb-1">
          <form action={resetDailyLimitAction.bind(null, user.id)} className="flex-1">
            <Button
              type="submit"
              variant="secondary"
              size="md"
              className="w-full"
              disabled={hasBonusToday}
            >
              {hasBonusToday ? "Napi limit már feloldva" : "Napi limit feloldása"}
            </Button>
          </form>
          <form action={toggleBanAction.bind(null, user.id, !user.isBanned)} className="flex-1">
            <Button type="submit" variant="danger" size="md" className="w-full">
              {user.isBanned ? "Tiltás feloldása" : "Felhasználó tiltása"}
            </Button>
          </form>
        </div>
      </PageTransition>

      {/* Tablet body — stat grid + full-width level progress, then best times
          and daily limit split side by side at the bottom (no room for the
          activity list too at this width). */}
      <div className="hidden flex-1 flex-col gap-4.5 overflow-y-auto px-6 py-5 md:flex xl:hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Avatar name={user.name} size={44} />
            <div>
              <div className="text-[17px] font-medium tracking-[-0.02em]">{user.name}</div>
              <div className="mono mt-1.5 text-[10.5px] text-text-faint">
                {user.email.toUpperCase()} · {user.isBanned ? "TILTVA" : "AKTÍV"} · CSATLAKOZOTT{" "}
                {formatDateHu(user.createdAt.toISOString().slice(0, 10))}
              </div>
            </div>
          </div>
          <form action={toggleBanAction.bind(null, user.id, !user.isBanned)}>
            <button
              type="submit"
              className={cn(
                "shrink-0 rounded-[8px] border px-3.25 py-2 text-[12.5px] font-medium",
                user.isBanned ? "border-border-strong text-text-secondary" : "border-danger-border text-danger"
              )}
            >
              {user.isBanned ? "Tiltás feloldása" : "Fiók letiltása"}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          <div className="rounded-[11px] border border-border bg-bg-inset p-4">
            <div className="mono text-[19px] font-medium tracking-[-0.02em]">{overallPct}%</div>
            <div className="mono mt-2 text-[10px] text-text-faint">TELJES HALADÁS</div>
          </div>
          <div className="rounded-[11px] border border-border bg-bg-inset p-4">
            <div className="mono text-[19px] font-medium tracking-[-0.02em]">
              {doneCount} / {totalCount}
            </div>
            <div className="mono mt-2 text-[10px] text-text-faint">EDZÉS KÉSZ</div>
          </div>
          <div className="rounded-[11px] border border-border bg-bg-inset p-4">
            <div className="mono text-[19px] font-medium tracking-[-0.02em]">{streakDays}</div>
            <div className="mono mt-2 text-[10px] text-text-faint">NAPOS SOROZAT</div>
          </div>
          <div className="rounded-[11px] border border-border bg-bg-inset p-4">
            <div className="mono text-[19px] font-medium tracking-[-0.02em]">
              {formatHoursMinutes(Math.round(totalStats.totalSeconds / 60))}
            </div>
            <div className="mono mt-2 text-[10px] text-text-faint">ÖSSZ. ÓRA</div>
          </div>
        </div>

        <EditUserPanel user={user} isSelf={admin.id === user.id} />

        <div className="flex flex-col gap-3.5 rounded-[12px] border border-border bg-bg-inset p-5">
          <span className="mono text-[10.5px] tracking-[0.08em] text-text-faint">SZINTENKÉNTI KÉSZÜLTSÉG</span>
          {levelsProgress.map((l) => {
            const lPct = l.totalCount > 0 ? l.doneCount / l.totalCount : 0;
            const lDone = l.totalCount > 0 && l.doneCount === l.totalCount;
            const lMinutes = Math.round(l.workouts.reduce((s, w) => s + (w.bestSeconds ?? 0), 0) / 60);
            return (
              <div key={l.id} className="rounded-[10px] border border-border bg-bg-elevated p-4">
                <div className="mb-2.75 flex items-center justify-between">
                  <span className="text-[13px] font-medium">
                    Szint {l.index} · {l.name}
                  </span>
                  <span className="mono text-[10.5px] text-text-faint">
                    {l.locked ? "ZÁROLT · —" : `${l.doneCount}/${l.totalCount} EDZÉS · ${formatHoursMinutes(lMinutes)} Ó`}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-border">
                  <div
                    className={cn("h-1.5 rounded-full", l.locked ? "bg-text-faint" : lDone ? "bg-success" : "bg-accent")}
                    style={{ width: `${lPct * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-4">
          <div className="flex-1 rounded-[12px] border border-border bg-bg-inset p-4.5">
            <div className="mono mb-1 text-[10.5px] tracking-[0.08em] text-text-faint">LEGJOBB IDŐK</div>
            {bestTimes.length === 0 ? (
              <p className="py-3 text-[12.5px] text-text-muted">Nincs rögzített stopperes eredmény.</p>
            ) : (
              bestTimes.map(({ category, row }) => (
                <div key={category.name} className="flex items-center gap-2.5 border-t border-border py-2.75">
                  <span className="flex-1 text-[12.5px] text-text-secondary">{category.name}</span>
                  <span className="mono text-[13px]">
                    {row ? (category.resultKind === "time" ? formatMs(row.value) : `${row.value} ISM`) : "—"}
                  </span>
                  <span className="mono w-6 text-right text-[10.5px] text-text-faint">
                    {row ? `${row.rank}.` : ""}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="flex-1 rounded-[12px] border border-border bg-bg-inset p-4.5">
            <div className="mono mb-3.5 text-[10.5px] tracking-[0.08em] text-text-faint">NAPI LIMIT</div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12.5px] text-text-secondary">
                {hasBonusToday ? "Ma extra edzés is indítható" : "A szokásos napi 1 edzésre korlátozva"}
              </span>
              <form action={resetDailyLimitAction.bind(null, user.id)}>
                <button
                  type="submit"
                  disabled={hasBonusToday}
                  className="shrink-0 rounded-[8px] border border-border-strong px-3.25 py-2 text-[12px] font-medium text-text-secondary disabled:opacity-50"
                >
                  {hasBonusToday ? "Feloldva" : "Feloldás"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop body */}
      <div className="hidden flex-1 gap-6 overflow-y-auto px-7 py-6 xl:flex">
        <div className="flex flex-1 flex-col gap-4.5">
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-[11px] border border-border bg-bg-inset p-4">
              <div className="mono text-[22px] font-medium tracking-[-0.02em]">{overallPct}%</div>
              <div className="mono mt-2.25 text-[10px] text-text-faint">TELJES HALADÁS</div>
            </div>
            <div className="rounded-[11px] border border-border bg-bg-inset p-4">
              <div className="mono text-[22px] font-medium tracking-[-0.02em]">
                {doneCount} / {totalCount}
              </div>
              <div className="mono mt-2.25 text-[10px] text-text-faint">EDZÉS KÉSZ</div>
            </div>
            <div className="rounded-[11px] border border-border bg-bg-inset p-4">
              <div className="mono text-[22px] font-medium tracking-[-0.02em]">{streakDays}</div>
              <div className="mono mt-2.25 text-[10px] text-text-faint">NAPOS SOROZAT</div>
            </div>
            <div className="rounded-[11px] border border-border bg-bg-inset p-4">
              <div className="mono text-[22px] font-medium tracking-[-0.02em]">
                {formatHoursMinutes(Math.round(totalStats.totalSeconds / 60))}
              </div>
              <div className="mono mt-2.25 text-[10px] text-text-faint">ÖSSZ. ÓRA</div>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3.5 rounded-[12px] border border-border bg-bg-inset p-5">
            <span className="mono text-[10.5px] tracking-[0.08em] text-text-faint">SZINTENKÉNTI KÉSZÜLTSÉG</span>
            {levelsProgress.map((l) => {
              const lPct = l.totalCount > 0 ? l.doneCount / l.totalCount : 0;
              const lDone = l.totalCount > 0 && l.doneCount === l.totalCount;
              const lMinutes = Math.round(l.workouts.reduce((s, w) => s + (w.bestSeconds ?? 0), 0) / 60);
              return (
                <div key={l.id} className="rounded-[10px] border border-border bg-bg-elevated p-4">
                  <div className="mb-2.75 flex items-center justify-between">
                    <span className="text-[13px] font-medium">
                      Szint {l.index} · {l.name}
                    </span>
                    <span className="mono text-[11px] text-text-faint">
                      {l.locked ? "ZÁROLT · —" : `${l.doneCount}/${l.totalCount} EDZÉS · ${formatHoursMinutes(lMinutes)} Ó`}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-border">
                    <div
                      className={cn("h-1.5 rounded-full", l.locked ? "bg-text-faint" : lDone ? "bg-success" : "bg-accent")}
                      style={{ width: `${lPct * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}

            <span className="mono mt-1.5 text-[10.5px] tracking-[0.08em] text-text-faint">NAPI LIMIT</span>
            <div className="flex items-center justify-between rounded-[10px] border border-border bg-bg-elevated p-4">
              <span className="text-[13px] text-text-secondary">
                {hasBonusToday ? "Ma extra edzés is indítható" : "A szokásos napi 1 edzésre korlátozva"}
              </span>
              <form action={resetDailyLimitAction.bind(null, user.id)}>
                <button
                  type="submit"
                  disabled={hasBonusToday}
                  className="rounded-[8px] border border-border-strong px-3.25 py-2 text-[12px] font-medium text-text-secondary disabled:opacity-50"
                >
                  {hasBonusToday ? "Feloldva" : "Napi limit feloldása"}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="flex w-[300px] shrink-0 flex-col gap-3.5">
          <div className="rounded-[12px] border border-border bg-bg-inset p-4.5">
            <div className="mono mb-1 text-[10.5px] tracking-[0.08em] text-text-faint">LEGJOBB IDŐK</div>
            {bestTimes.length === 0 ? (
              <p className="py-3 text-[12.5px] text-text-muted">Nincs rögzített stopperes eredmény.</p>
            ) : (
              bestTimes.map(({ category, row }) => (
                <div key={category.name} className="flex items-center gap-2.5 border-t border-border py-2.75">
                  <span className="flex-1 text-[12.5px] text-text-secondary">{category.name}</span>
                  <span className="mono text-[13px]">
                    {row ? (category.resultKind === "time" ? formatMs(row.value) : `${row.value} ISM`) : "—"}
                  </span>
                  <span className="mono w-6 text-right text-[10.5px] text-text-faint">
                    {row ? `${row.rank}.` : ""}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="flex-1 rounded-[12px] border border-border bg-bg-inset p-4.5">
            <div className="mono mb-1 text-[10.5px] tracking-[0.08em] text-text-faint">UTOLSÓ AKTIVITÁS</div>
            {history.length === 0 ? (
              <p className="py-3 text-[12.5px] text-text-muted">Még nincs teljesített edzés.</p>
            ) : (
              history.slice(0, 6).map((h) => (
                <div key={h.sessionId} className="border-t border-border py-2.75">
                  <div className="text-[12.5px] text-text-secondary">{h.workoutName}</div>
                  <div className="mono mt-1.5 text-[10px] text-text-faint">{relativeDayLabel(h.sessionDate)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
