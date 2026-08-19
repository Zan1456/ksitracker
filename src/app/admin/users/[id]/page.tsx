import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { getAdminUserDetail } from "@/lib/admin-data";
import { formatMs, formatDateHu } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconCheck } from "@/components/icons";
import { cn } from "@/lib/cn";
import { toggleBanAction, resetDailyLimitAction } from "@/app/admin/actions";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const detail = await getAdminUserDetail(id);
  if (!detail) notFound();

  const { user, levelsProgress, doneCount, totalCount, rank, totalUsers, bestTimes, streakDays, hasBonusToday } =
    detail;

  return (
    <AppShell>
      <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
        <Link
          href="/admin"
          className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border text-text-secondary"
        >
          <IconArrowLeft width={15} height={15} />
        </Link>
        <span className="text-[13.5px] font-medium text-text-secondary">Felhasználók</span>
      </div>

      <div className="flex flex-1 flex-col gap-5 px-5 pb-6 pt-4.5">
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

        <div className="flex flex-col gap-2">
          <div className="mono text-[10.5px] text-text-faint">SZINTENKÉNTI KÉSZÜLTSÉG</div>
          {levelsProgress.map((l) => (
            <div
              key={l.id}
              className={cn(
                "flex items-center gap-2.75 rounded-[9px] border border-border bg-bg-elevated px-3.25 py-2.75",
                l.locked && "opacity-60"
              )}
            >
              <span className="flex-1 text-[12.5px] font-medium">
                Szint {l.index} · {l.name}
              </span>
              <span className="flex gap-1">
                {l.workouts.map((w) => (
                  <span
                    key={w.id}
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-[4px] text-[9px] font-medium",
                      w.done ? "bg-success-bg text-success" : "bg-bg-inset"
                    )}
                  >
                    {w.done && <IconCheck width={9} height={9} strokeWidth={3} />}
                  </span>
                ))}
              </span>
            </div>
          ))}
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
      </div>
    </AppShell>
  );
}
