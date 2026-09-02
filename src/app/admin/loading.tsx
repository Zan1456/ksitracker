import { AppShell } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { Skeleton } from "@/components/skeleton";

export default function AdminOverviewLoading() {
  return (
    <AppShell>
      <div className="px-5.5 pb-3 pt-1.5">
        <Skeleton className="h-7 w-40" />
      </div>
      <div className="flex flex-col gap-3.5 px-5.5">
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[86px] w-full rounded-[22px]" />
          ))}
        </div>
        <Skeleton className="h-[140px] w-full rounded-[22px]" />
        <Skeleton className="h-[220px] w-full rounded-[22px]" />
      </div>
      <BottomNav variant="admin" />
    </AppShell>
  );
}
