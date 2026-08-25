import { AppShell, AppHeader } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { Skeleton } from "@/components/skeleton";

export default function AdminStatsLoading() {
  return (
    <AppShell nav="admin">
      <AppHeader title="Statisztika" />
      <div className="flex flex-1 flex-col gap-2.5 px-5 py-4">
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-[78px] w-full rounded-[10px]" />
          ))}
        </div>
      </div>
      <BottomNav variant="admin" />
    </AppShell>
  );
}
