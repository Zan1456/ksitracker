import { requireAdmin } from "@/lib/auth-helpers";
import { getAppStats } from "@/lib/admin-data";
import { AppShell, AppHeader } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";

export default async function AdminStatsPage() {
  await requireAdmin();
  const stats = await getAppStats();

  const tiles: { label: string; value: string | number; suffix?: string }[] = [
    { label: "FELHASZNÁLÓK", value: stats.totalUsers },
    { label: "AKTÍV (7 NAP)", value: stats.activeLast7 },
    { label: "MA TELJESÍTVE", value: stats.completedToday },
    { label: "ÖSSZES EDZÉS", value: stats.totalWorkouts },
    { label: "SZINTEK", value: stats.totalLevels },
    { label: "TELJESÍTETT EDZÉS", value: stats.totalCompletedSessions },
    { label: "ÖSSZ. EDZETT IDŐ", value: stats.totalHours, suffix: "ó" },
  ];

  return (
    <AppShell>
      <AppHeader title="Statisztika" />

      <div className="flex flex-1 flex-col gap-2.5 px-5 py-4">
        <div className="grid grid-cols-2 gap-2.5">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-[10px] border border-border p-3.5">
              <div className="mono mb-2 text-[10px] text-text-faint">{t.label}</div>
              <div className="text-[20px] font-medium">
                {t.value}
                {t.suffix && <span className="ml-1 text-[12px] text-text-faint">{t.suffix}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav variant="admin" />
    </AppShell>
  );
}
