import { asc } from "drizzle-orm";
import { db } from "@/db";
import { levels } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-helpers";
import { getAppStats, getAdminUserList } from "@/lib/admin-data";
import { getOrCreateChallengeSettings, getChallengeTasks } from "@/lib/challenge-data";
import { initials } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { PageTransition } from "@/components/motion/page-transition";
import { enterUserViewAction } from "@/lib/admin-user-view";

export default async function AdminOverviewPage() {
  const admin = await requireAdmin();

  const [stats, userRows, allLevels, challengeSettings, challengeTasks] = await Promise.all([
    getAppStats(),
    getAdminUserList(),
    db.select().from(levels).orderBy(asc(levels.order)),
    getOrCreateChallengeSettings(),
    getChallengeTasks(),
  ]);

  const levelUserCounts = new Map<number, number>();
  for (const u of userRows) levelUserCounts.set(u.currentLevelIndex, (levelUserCounts.get(u.currentLevelIndex) ?? 0) + 1);

  const kpis = [
    { v: stats.totalUsers, k: "AKTÍV TAG" },
    { v: stats.activeLast7, k: "AKTÍV 7 NAPBAN" },
    { v: stats.totalWorkouts, k: "EDZÉS A TERVBEN" },
    { v: stats.completedToday, k: "MA TELJESÍTVE" },
  ];

  const maxCount = Math.max(1, ...stats.dailyCounts.map((d) => d.count));

  const roleLabel = admin.adminPermissions ? "ADMIN" : "FŐ ADMIN";

  return (
    <AppShell>
      <div className="flex items-start justify-between gap-3 px-5.5 pb-3 pt-1.5">
        <div>
          <div className="text-[25px] font-extrabold leading-[1.1] tracking-[-0.03em]">Áttekintés</div>
          <div className="mono mt-2.25 text-[10.5px] tracking-[0.12em] text-white/65">
            {admin.name?.toUpperCase()} · {roleLabel}
          </div>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/16 text-[13px] font-extrabold">
          {initials(admin.name ?? "?")}
        </span>
      </div>

      <PageTransition className="gap-3.5 overflow-y-auto px-5.5 pb-8">
        <div className="grid shrink-0 grid-cols-2 gap-2.5">
          {kpis.map((k) => (
            <div key={k.k} className="rounded-[22px] border border-white/16 bg-white/10 p-4.25">
              <div className="mono text-[24px] font-extrabold leading-none">{k.v}</div>
              <div className="mono mt-2.5 text-[9.5px] tracking-[0.08em] text-white/62">{k.k}</div>
            </div>
          ))}
        </div>

        <div className="shrink-0 rounded-[22px] border border-white/15 bg-white/8 p-4.5">
          <div className="mono mb-3.5 text-[10.5px] tracking-[0.14em] text-white/60">NAPI EDZÉSEK · 14 NAP</div>
          <div className="flex h-20 items-end gap-1.25">
            {stats.dailyCounts.map((d) => (
              <div
                key={d.iso}
                title={`${d.iso}: ${d.count}`}
                className={`flex-1 rounded-[4px] ${d.count > maxCount * 0.55 ? "bg-accent" : "bg-white/24"}`}
                style={{ height: `${Math.max(6, (d.count / maxCount) * 100)}%` }}
              />
            ))}
          </div>
        </div>

        <div className="shrink-0 overflow-hidden rounded-[22px] border border-white/15 bg-white/8">
          <div className="mono border-b border-white/8 px-4.5 py-3.75 text-[10.5px] tracking-[0.14em] text-white/60">
            SZINTEK ÁLLAPOTA
          </div>
          {allLevels.map((l) => (
            <div key={l.id} className="flex items-center gap-3 border-b border-white/8 px-4.5 py-3.5 last:border-b-0">
              <span className="flex-1">
                <span className="block text-[13px] font-bold">{l.name}</span>
                <span className="mono mt-1.75 block text-[10.5px] text-white/70">
                  KIHÍVÁS {challengeSettings.minRequired}/{challengeTasks.length}
                </span>
              </span>
              <span className="mono text-[11.5px] font-semibold text-white/75">
                {levelUserCounts.get(l.index) ?? 0} tag
              </span>
            </div>
          ))}
        </div>

        <div className="shrink-0 rounded-[24px] bg-accent p-5 text-accent-fg">
          <div className="text-[21px] font-extrabold leading-[1.15] tracking-[-0.02em]">Tag nézet</div>
          <p className="m-0 mt-2.25 mb-3.75 text-[12.5px] font-semibold leading-[1.45] text-black/72">
            Nyisd meg az appot tagként: szintterv, edzések, kihívás, ranglista és profil is elérhető, majd egy
            koppintással vissza.
          </p>
          <form action={enterUserViewAction}>
            <button
              type="submit"
              className="rounded-full bg-[#0A0A0B] px-5 py-3.5 text-[13px] font-bold text-white"
            >
              Megnyitás tagként
            </button>
          </form>
        </div>

        <div className="h-24 shrink-0" aria-hidden />
      </PageTransition>

      <BottomNav variant="admin" />
    </AppShell>
  );
}
