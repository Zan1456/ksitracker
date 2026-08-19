import { requireUser } from "@/lib/auth-helpers";
import {
  getLevelsWithProgress,
  getStreakDays,
  getTotalStats,
  getHistory,
  getActivityGrid,
} from "@/lib/workout-data";
import { formatHoursMinutes, formatSeconds, formatDateHu, todayIso, isoDaysAgo } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { Avatar } from "@/components/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { PageTransition } from "@/components/motion/page-transition";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-list";
import { cn } from "@/lib/cn";
import { signOutAction } from "./actions";

function relativeDateLabel(iso: string, levelIndex: number) {
  const today = todayIso();
  const yesterday = isoDaysAgo(1);
  const when = iso === today ? "MA" : iso === yesterday ? "TEGNAP" : formatDateHu(iso).toUpperCase();
  return `${when} · SZINT ${levelIndex}`;
}

export default async function ProfilePage() {
  const user = await requireUser();

  const [levels, streak, stats, history, grid] = await Promise.all([
    getLevelsWithProgress(user.id),
    getStreakDays(user.id),
    getTotalStats(user.id),
    getHistory(user.id, 8),
    getActivityGrid(user.id, 28),
  ]);

  const totalWorkouts = levels.reduce((s, l) => s + l.totalCount, 0);
  const doneWorkouts = levels.reduce((s, l) => s + l.doneCount, 0);

  return (
    <AppShell>
      <PageTransition className="gap-5 overflow-y-auto px-5 pb-6 pt-5">
        <div className="flex items-center gap-3.5">
          <Avatar name={user.name ?? "?"} size={52} />
          <div className="flex-1">
            <div className="text-[18px] font-medium tracking-[-0.02em]">{user.name}</div>
            <div className="mt-1 text-[12px] text-text-muted">{user.email}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-[9px] border border-border p-3">
            <div className="mono mb-2 text-[10px] text-text-faint">SOROZAT</div>
            <div className="text-[17px] font-medium">
              {streak} <span className="text-[11px] text-text-faint">nap</span>
            </div>
          </div>
          <div className="rounded-[9px] border border-border p-3">
            <div className="mono mb-2 text-[10px] text-text-faint">EDZÉS</div>
            <div className="text-[17px] font-medium">
              {doneWorkouts}
              <span className="text-[11px] text-text-faint">/{totalWorkouts}</span>
            </div>
          </div>
          <div className="rounded-[9px] border border-border p-3">
            <div className="mono mb-2 text-[10px] text-text-faint">ÖSSZ. IDŐ</div>
            <div className="text-[17px] font-medium">
              {formatHoursMinutes(Math.round(stats.totalSeconds / 60))}{" "}
              <span className="text-[11px] text-text-faint">ó</span>
            </div>
          </div>
        </div>

        <div className="rounded-[10px] border border-border p-4">
          <div className="mb-3.5 flex items-center justify-between">
            <span className="text-[13px] font-medium">Utolsó 4 hét</span>
            <span className="mono text-[10.5px] text-text-faint">28 NAP</span>
          </div>
          <div className="grid grid-cols-[repeat(14,1fr)] gap-1">
            {grid.map((d) => (
              <div
                key={d.iso}
                title={d.iso}
                className={cn(
                  "aspect-square rounded-[3px]",
                  d.done ? "bg-success" : "bg-bg-inset",
                  d.isToday && !d.done && "border border-warning"
                )}
                style={d.done ? { opacity: 0.85 } : undefined}
              />
            ))}
          </div>
        </div>

        <ThemeToggle />

        <div className="flex flex-col gap-1">
          <div className="mono mb-1 text-[10.5px] text-text-faint">ELŐZMÉNYEK</div>
          {history.length === 0 && (
            <p className="py-3 text-[12.5px] text-text-muted">Még nincs teljesített edzésed.</p>
          )}
          <StaggerContainer className="flex flex-col">
            {history.map((h) => (
              <StaggerItem
                key={h.sessionId}
                className="flex items-center gap-3 border-b border-border py-3"
              >
                <div className="flex-1">
                  <div className="text-[13px] font-medium">{h.workoutName}</div>
                  <div className="mono mt-1 text-[10.5px] text-text-faint">
                    {relativeDateLabel(h.sessionDate, h.levelIndex)}
                  </div>
                </div>
                <span className="mono text-[12.5px] text-text-secondary">
                  {h.totalSeconds ? formatSeconds(h.totalSeconds) : "—"}
                </span>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        <form action={signOutAction} className="mt-1">
          <button className="w-full rounded-lg border border-border py-3 text-[13px] text-text-muted hover:text-text">
            Kijelentkezés
          </button>
        </form>
      </PageTransition>

      <BottomNav variant="user" />
    </AppShell>
  );
}
