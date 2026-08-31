import { AppShell } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { Skeleton } from "@/components/skeleton";

export default function AdminStatsLoading() {
  return (
    <AppShell nav="admin" wide>
      <div className="border-b border-border px-5 py-3.5 xl:px-7 xl:py-5">
        <span className="text-[16px] font-medium tracking-[-0.02em] xl:text-[19px]">Statisztika</span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 px-5 py-4 xl:px-7 xl:py-6">
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-[78px] w-full rounded-[12px]" />
          ))}
        </div>
      </div>
      <BottomNav variant="admin" />
    </AppShell>
  );
}
