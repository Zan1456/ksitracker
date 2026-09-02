import { AppShell } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { Skeleton } from "@/components/skeleton";

export default function AdminStatsLoading() {
  return (
    <AppShell>
      <div className="border-b border-border px-5 py-3.5">
        <span className="text-[16px] font-medium tracking-[-0.02em]">Statisztika</span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 px-5 py-4">
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-[78px] w-full rounded-[12px]" />
          ))}
        </div>
      </div>
      <BottomNav variant="admin" />
    </AppShell>
  );
}
