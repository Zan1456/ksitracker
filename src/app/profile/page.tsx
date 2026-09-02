import { requireUser } from "@/lib/auth-helpers";
import { getLevelsWithProgress, getStreakDays, getHistory, getActivityGrid } from "@/lib/workout-data";
import { getLeaderboardCategories, getLeaderboard } from "@/lib/leaderboard";
import { getUserSettings } from "@/lib/user-settings";
import { formatMs, formatSeconds, formatDateHu, todayIso, isoDaysAgo } from "@/lib/format";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-list";
import { AppShell } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { Avatar } from "@/components/avatar";
import { SettingsToggle } from "@/components/settings-toggle";
import { ExportCsvButton } from "@/components/export-csv-button";
import { PageTransition } from "@/components/motion/page-transition";
import { cn } from "@/lib/cn";
import { signOutAction } from "@/lib/auth-actions";

function relativeDateLabel(iso: string, levelIndex: number) {
  const today = todayIso();
  const yesterday = isoDaysAgo(1);
  const when = iso === today ? "MA" : iso === yesterday ? "TEGNAP" : formatDateHu(iso).toUpperCase();
  return `${when} · SZINT ${levelIndex}`;
}

export default async function ProfilePage() {
  const user = await requireUser();

  const [levels, streak, history, grid, categories, settings] = await Promise.all([
    getLevelsWithProgress(user.id),
    getStreakDays(user.id),
    getHistory(user.id, 8),
    getActivityGrid(user.id, 28),
    getLeaderboardCategories(),
    getUserSettings(user.id),
  ]);

  const doneWorkouts = levels.reduce((s, l) => s + l.doneCount, 0);
  const challengesDone = levels.filter((l) => l.challengePassed).length;

  const leaderboardRows = await Promise.all(categories.map((c) => getLeaderboard(c.name)));
  const records = categories
    .map((c, i) => {
      const row = leaderboardRows[i].rows.find((r) => r.userId === user.id);
      if (!row) return null;
      return { name: c.name, value: c.resultKind === "time" ? formatMs(row.value) : `${row.value} ISM` };
    })
    .filter((x): x is { name: string; value: string } => x !== null);

  const stats = [
    { v: doneWorkouts, k: "EDZÉS" },
    { v: streak, k: "SOROZAT" },
    { v: challengesDone, k: "KIHÍVÁS" },
  ];

  return (
    <AppShell>
      <PageTransition className="gap-3.5 overflow-y-auto px-5.5 pb-8 pt-1.5">
        <div className="flex items-center gap-3.5">
          <Avatar name={user.name ?? "?"} size={54} className="!bg-white/16 !border-white/20 !text-white" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[20px] font-extrabold leading-[1.1] tracking-[-0.02em]">{user.name}</div>
            <div className="mono mt-2 truncate text-[10.5px] tracking-[0.08em] text-white/60">{user.email}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.25">
          {stats.map((s) => (
            <div key={s.k} className="rounded-[20px] border border-white/16 bg-white/10 p-3.75">
              <div className="mono text-[21px] font-extrabold leading-none">{s.v}</div>
              <div className="mono mt-2.25 text-[9.5px] tracking-[0.08em] text-white/60">{s.k}</div>
            </div>
          ))}
        </div>

        <div className="rounded-[22px] border border-white/15 bg-white/8 p-4.25">
          <div className="mb-3.5 flex items-center justify-between">
            <span className="text-[13px] font-bold">Utolsó 4 hét</span>
            <span className="mono text-[10.5px] text-white/60">28 NAP</span>
          </div>
          <div className="grid grid-cols-[repeat(14,1fr)] gap-1">
            {grid.map((d) => (
              <div
                key={d.iso}
                title={d.iso}
                className={cn(
                  "aspect-square rounded-[3px]",
                  d.done ? "bg-accent" : "bg-white/12",
                  d.isToday && !d.done && "border border-warning"
                )}
              />
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[22px] border border-white/15 bg-white/8">
          <div className="mono border-b border-white/8 px-4.5 py-3.75 text-[10.5px] tracking-[0.14em] text-white/60">
            SZINTEK
          </div>
          {levels.map((level) => {
            const pct = level.totalCount > 0 ? Math.round((level.doneCount / level.totalCount) * 100) : 0;
            return (
              <div key={level.id} className="flex items-center gap-3 border-b border-white/8 px-4.5 py-3.5 last:border-b-0">
                <span className="w-22 shrink-0 truncate text-[13px] font-bold">{level.name}</span>
                <span className="h-1.5 flex-1 rounded-full bg-white/18">
                  <span className="block h-1.5 rounded-full bg-accent" style={{ width: `${pct}%` }} />
                </span>
                <span className="mono w-13 shrink-0 text-right text-[10.5px] font-semibold text-white/70">
                  {level.challengePassed ? "ZÁRVA" : `${level.doneCount}/${level.totalCount}`}
                </span>
              </div>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-[22px] border border-white/15 bg-white/8">
          <div className="mono border-b border-white/8 px-4.5 py-3.75 text-[10.5px] tracking-[0.14em] text-white/60">
            KIHÍVÁS-REKORDOK
          </div>
          {records.length === 0 ? (
            <p className="px-4.5 py-4 text-[12.5px] font-semibold text-white/60">Még nincs kihívás-eredményed.</p>
          ) : (
            records.map((r) => (
              <div key={r.name} className="flex items-center border-b border-white/8 px-4.5 py-3.5 last:border-b-0">
                <span className="flex-1 truncate text-[13.5px] font-semibold">{r.name}</span>
                <span className="mono text-[13.5px] font-bold text-accent">{r.value}</span>
              </div>
            ))
          )}
        </div>

        <div className="overflow-hidden rounded-[22px] border border-white/15 bg-white/8">
          <div className="mono border-b border-white/8 px-4.5 py-3.75 text-[10.5px] tracking-[0.14em] text-white/60">
            ELŐZMÉNYEK
          </div>
          {history.length === 0 ? (
            <p className="px-4.5 py-4 text-[12.5px] font-semibold text-white/60">Még nincs teljesített edzésed.</p>
          ) : (
            <StaggerContainer>
              {history.map((h) => (
                <StaggerItem
                  key={h.sessionId}
                  className="flex items-center gap-3 border-b border-white/8 px-4.5 py-3.5 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold">{h.workoutName}</div>
                    <div className="mono mt-1.75 text-[10.5px] text-white/55">
                      {relativeDateLabel(h.sessionDate, h.levelIndex)}
                    </div>
                  </div>
                  <span className="mono text-[12.5px] font-semibold text-white/75">
                    {h.totalSeconds ? formatSeconds(h.totalSeconds) : "—"}
                  </span>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>

        <div className="overflow-hidden rounded-[22px] border border-white/15 bg-white/8">
          <SettingsToggle
            settingKey="reminderEnabled"
            name="Napi emlékeztető"
            sub="Értesítés, ha még nem edzettél ma"
            initialValue={settings.reminderEnabled}
          />
          <SettingsToggle
            settingKey="autoRestEnabled"
            name="Automatikus pihenő"
            sub="Visszaszámlálás a feladatok között"
            initialValue={settings.autoRestEnabled}
          />
          <SettingsToggle
            settingKey="soundEnabled"
            name="Hangjelzés"
            sub="Rövid jelzés a feladatok végén"
            initialValue={settings.soundEnabled}
          />
        </div>

        <div className="flex gap-2.25">
          <ExportCsvButton className="flex-1 rounded-full border border-white/25 bg-white/10 py-3.75 text-[13px] font-bold text-white" />
          <form action={signOutAction} className="flex-1">
            <button
              type="submit"
              className={cn(
                "w-full rounded-full border py-3.75 text-[13px] font-bold",
                "border-danger-border bg-danger-bg text-danger"
              )}
            >
              Kijelentkezés
            </button>
          </form>
        </div>

        <div className="h-24 shrink-0" aria-hidden />
      </PageTransition>

      <BottomNav variant="user" />
    </AppShell>
  );
}
