import { AppShell } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { Skeleton } from "@/components/skeleton";

export default function LeaderboardLoading() {
  return (
    <AppShell nav="user">
      <div className="border-b border-border px-5 pb-3.5 pt-4">
        <Skeleton className="mb-3.5 h-7 w-32" />
        <Skeleton className="h-[54px] w-full rounded-[9px]" />
        <Skeleton className="mt-3.25 h-9 w-full rounded-[9px]" />
      </div>
      <div className="flex flex-1 flex-col gap-4 px-5 pt-4.5">
        <Skeleton className="h-[150px] w-full rounded-[11px]" />
        <div className="flex flex-col gap-1.75">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-[46px] w-full rounded-[9px]" />
          ))}
        </div>
      </div>
      <BottomNav variant="user" />
    </AppShell>
  );
}
