import { AppShell } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { Skeleton } from "@/components/skeleton";

export default function ProfileLoading() {
  return (
    <AppShell nav="user">
      <div className="flex flex-1 flex-col gap-5 px-5 pb-6 pt-5">
        <div className="flex items-center gap-3.5">
          <Skeleton className="h-[52px] w-[52px] rounded-full" />
          <div className="flex-1">
            <Skeleton className="mb-2 h-5 w-32" />
            <Skeleton className="h-3.5 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-[64px] w-full rounded-[9px]" />
          ))}
        </div>
        <Skeleton className="h-[150px] w-full rounded-[10px]" />
        <Skeleton className="h-[46px] w-full rounded-[10px]" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-[46px] w-full" />
          ))}
        </div>
      </div>
      <BottomNav variant="user" />
    </AppShell>
  );
}
