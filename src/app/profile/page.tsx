import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import {
  getLevelsWithProgress,
  getStreakDays,
  getTotalStats,
  getHistory,
  getActivityGrid,
} from "@/lib/workout-data";
import { getLeaderboardCategories, getLeaderboard } from "@/lib/leaderboard";
import { formatHoursMinutes, formatSeconds, formatMs, formatDateHu, todayIso, isoDaysAgo } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { Avatar } from "@/components/avatar";
import { ThemeToggle, ThemeToggleButton } from "@/components/theme-toggle";
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

  const [levels, streak, stats, history, grid, categories, joined] = await Promise.all([
    getLevelsWithProgress(user.id),
    getStreakDays(user.id),
    getTotalStats(user.id),
    getHistory(user.id, 8),
    getActivityGrid(user.id, 28),
    getLeaderboardCategories(),
    db.select({ createdAt: users.createdAt }).from(users).where(eq(users.id, user.id)).limit(1),
  ]);

  const totalWorkouts = levels.reduce((s, l) => s + l.totalCount, 0);
  const doneWorkouts = levels.reduce((s, l) => s + l.doneCount, 0);
  const fastestSeconds = history.reduce<number | null>(
    (min, h) => (h.totalSeconds != null && (min === null || h.totalSeconds < min) ? h.totalSeconds : min),
    null
  );

  const personalBestRows = await Promise.all(categories.map((c) => getLeaderboard(c.name)));
  const personalBests = categories
    .map((c, i) => {
      const row = personalBestRows[i].rows.find((r) => r.userId === user.id);
      if (!row) return null;
      return {
        name: c.name,
        value: c.resultKind === "time" ? formatMs(row.value) : `${row.value} ISM`,
      };
    })
    .filter((x): x is { name: string; value: string } => x !== null);

  const joinedLabel = joined[0]?.createdAt
    ? formatDateHu(joined[0].createdAt.toISOString().slice(0, 10))
    : null;

  return (
    <AppShell nav="user" wide>
      {/* Mobile/tablet body */}
      <PageTransition className="gap-5 overflow-y-auto px-5 pb-6 pt-5 xl:hidden">
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

      {/* Desktop body */}
      <div className="hidden flex-1 flex-col xl:flex">
        <div className="flex items-center justify-between border-b border-border px-7 py-5">
          <div>
            <div className="text-[19px] font-medium tracking-[-0.02em]">{user.name}</div>
            <div className="mono mt-2 text-[11px] text-text-faint">
              {user.email?.toUpperCase()}
              {joinedLabel ? ` · CSATLAKOZOTT ${joinedLabel}` : ""}
            </div>
          </div>
          <div className="flex gap-2.5">
            <form action={signOutAction}>
              <button className="rounded-[8px] border border-border-strong px-3.5 py-2 text-[12.5px] font-medium text-text-secondary">
                Kijelentkezés
              </button>
            </form>
            <ThemeToggleButton />
          </div>
        </div>

        <div className="flex flex-1 gap-6 overflow-hidden px-7 py-6">
          <div className="flex flex-1 flex-col gap-4.5">
            <div className="grid grid-cols-4 gap-3">
              <div className="rounded-[11px] border border-border bg-bg-inset p-4">
                <div className="mono text-[22px] font-medium tracking-[-0.02em]">{streak}</div>
                <div className="mono mt-2.25 text-[10px] text-text-faint">NAPOS SOROZAT</div>
              </div>
              <div className="rounded-[11px] border border-border bg-bg-inset p-4">
                <div className="mono text-[22px] font-medium tracking-[-0.02em]">
                  {doneWorkouts} / {totalWorkouts}
                </div>
                <div className="mono mt-2.25 text-[10px] text-text-faint">EDZÉS KÉSZ</div>
              </div>
              <div className="rounded-[11px] border border-border bg-bg-inset p-4">
                <div className="mono text-[22px] font-medium tracking-[-0.02em]">
                  {formatHoursMinutes(Math.round(stats.totalSeconds / 60))}
                </div>
                <div className="mono mt-2.25 text-[10px] text-text-faint">ÖSSZ. ÓRA</div>
              </div>
              <div className="rounded-[11px] border border-border bg-bg-inset p-4">
                <div className="mono text-[22px] font-medium tracking-[-0.02em]">
                  {fastestSeconds != null ? formatSeconds(fastestSeconds) : "—"}
                </div>
                <div className="mono mt-2.25 text-[10px] text-text-faint">LEGGYORSABB EDZÉS</div>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3.5 overflow-hidden rounded-[12px] border border-border bg-bg-inset p-5">
              <div className="flex items-center justify-between">
                <span className="mono text-[10.5px] tracking-[0.08em] text-text-faint">EDZÉSNAPLÓ</span>
                <span className="mono text-[10.5px] text-text-faint">UTOLSÓ 28 NAP</span>
              </div>
              <div className="flex items-end gap-1" style={{ height: 96 }}>
                {grid.map((d) => (
                  <div
                    key={d.iso}
                    title={d.iso}
                    className={cn("flex-1 rounded-[3px]", d.done ? "bg-text-secondary" : "bg-bg-elevated")}
                    style={{ height: d.done ? "100%" : "8%" }}
                  />
                ))}
              </div>
              <div className="flex flex-1 flex-col overflow-y-auto">
                {history.length === 0 ? (
                  <p className="py-4 text-center text-[12.5px] text-text-muted">Még nincs teljesített edzésed.</p>
                ) : (
                  history.map((h) => (
                    <div key={h.sessionId} className="flex items-center gap-3.5 border-t border-border py-3">
                      <span className="text-[11px] font-medium text-success">✓</span>
                      <div className="flex-1">
                        <div className="text-[13.5px]">{h.workoutName}</div>
                        <div className="mono mt-1.5 text-[10px] text-text-faint">
                          {relativeDateLabel(h.sessionDate, h.levelIndex)}
                        </div>
                      </div>
                      <span className="mono text-[14px] text-text-secondary">
                        {h.totalSeconds ? formatSeconds(h.totalSeconds) : "—"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex w-[290px] shrink-0 flex-col gap-3.5">
            <div className="rounded-[12px] border border-border bg-bg-inset p-4.5">
              <div className="mono mb-3.5 text-[10.5px] tracking-[0.08em] text-text-faint">SZINTEK</div>
              {levels.map((level) => {
                const levelPct = level.totalCount > 0 ? level.doneCount / level.totalCount : 0;
                const levelDone = level.totalCount > 0 && level.doneCount === level.totalCount;
                return (
                  <div key={level.id} className="mb-3.5 last:mb-0">
                    <div className="mb-2 flex justify-between">
                      <span className="text-[12.5px] font-medium">Szint {level.index}</span>
                      <span
                        className={cn(
                          "mono text-[11px]",
                          level.locked ? "text-text-faint" : levelDone ? "text-success" : "text-warning"
                        )}
                      >
                        {level.doneCount}/{level.totalCount}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-border">
                      <div
                        className={cn(
                          "h-1.5 rounded-full",
                          level.locked ? "bg-text-faint" : levelDone ? "bg-success" : "bg-warning"
                        )}
                        style={{ width: `${levelPct * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-[12px] border border-border bg-bg-inset p-4.5">
              <div className="mono mb-1 text-[10.5px] tracking-[0.08em] text-text-faint">SZEMÉLYES REKORDOK</div>
              {personalBests.length === 0 ? (
                <p className="py-3 text-[12.5px] text-text-muted">Még nincs rögzített eredményed.</p>
              ) : (
                personalBests.map((b) => (
                  <div key={b.name} className="flex justify-between border-t border-border py-2.5">
                    <span className="text-[12.5px] text-text-secondary">{b.name}</span>
                    <span className="mono text-[13px]">{b.value}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <BottomNav variant="user" />
    </AppShell>
  );
}
