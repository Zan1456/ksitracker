import { requireAdmin } from "@/lib/auth-helpers";
import { getAppStats } from "@/lib/admin-data";
import { AppShell, AppHeader } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { PageTransition } from "@/components/motion/page-transition";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-list";

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

      <PageTransition className="gap-2.5 overflow-y-auto px-5 py-4">
        <StaggerContainer className="grid grid-cols-2 gap-2.5">
          {tiles.map((t) => (
            <StaggerItem key={t.label} className="rounded-[10px] border border-border p-3.5">
              <div className="mono mb-2 text-[10px] text-text-faint">{t.label}</div>
              <div className="text-[20px] font-medium">
                {t.value}
                {t.suffix && <span className="ml-1 text-[12px] text-text-faint">{t.suffix}</span>}
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </PageTransition>

      <BottomNav variant="admin" />
    </AppShell>
  );
}
