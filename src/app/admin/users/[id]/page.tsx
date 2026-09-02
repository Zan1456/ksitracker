import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { getAdminUserDetail } from "@/lib/admin-data";
import { getHistory } from "@/lib/workout-data";
import { formatMs, formatDateHu, formatHoursMinutes } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { IconArrowLeft } from "@/components/icons";
import { cn } from "@/lib/cn";
import { PageTransition } from "@/components/motion/page-transition";
import { EditUserPanel } from "@/components/admin/edit-user-panel";
import { AdminNoteField } from "@/components/admin/admin-note-field";
import { SessionHistoryList } from "@/components/admin/session-history-list";
import { toggleBanAction, resetDailyLimitAction } from "@/app/admin/actions";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin("users");
  const { id } = await params;
  const [detail, history] = await Promise.all([getAdminUserDetail(id), getHistory(id, 10)]);
  if (!detail) notFound();

  const { user, levelsProgress, doneCount, totalCount, rank, totalUsers, bestTimes, streakDays, hasBonusToday } =
    detail;

  return (
    <AppShell>
      <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
        <Link
          href="/admin/users"
          className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border text-text-secondary"
        >
          <IconArrowLeft width={15} height={15} />
        </Link>
        <span className="text-[13.5px] font-medium text-text-secondary">Felhasználók</span>
      </div>

      <PageTransition className="gap-5 overflow-y-auto px-5 pb-6 pt-4.5">
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

        <AdminNoteField userId={user.id} initialNote={user.adminNote} />

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
    </AppShell>
  );
}
