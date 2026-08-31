import { requireAdmin } from "@/lib/auth-helpers";
import { getAppStats } from "@/lib/admin-data";
import { AppShell } from "@/components/app-shell";
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
    <AppShell nav="admin" wide>
      {/* Same bordered (non-glass, non-sticky) header every other admin page uses. */}
      <div className="border-b border-border px-5 py-3.5 xl:px-7 xl:py-5">
        <span className="text-[16px] font-medium tracking-[-0.02em] xl:text-[19px]">Statisztika</span>
      </div>

      <PageTransition className="gap-2.5 overflow-y-auto px-5 py-4 xl:px-7 xl:py-6">
        <StaggerContainer className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-4">
          {tiles.map((t) => (
            <StaggerItem
              key={t.label}
              className="rounded-[12px] border border-border bg-bg-inset p-4"
            >
              <div className="mono mb-2.25 text-[10px] text-text-faint">{t.label}</div>
              <div className="mono text-[19px] font-medium tracking-[-0.02em] xl:text-[22px]">
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
