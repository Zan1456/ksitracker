import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/skeleton";

export default function AdminUserLoading() {
  return (
    <AppShell>
      <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
        <Skeleton className="h-[30px] w-[30px] rounded-lg" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="flex flex-1 flex-col gap-4.5 px-5 pb-6 pt-4.5">
        <div className="flex items-center gap-3.25">
          <Skeleton className="h-[46px] w-[46px] rounded-full" />
          <div className="flex-1">
            <Skeleton className="mb-2 h-5 w-32" />
            <Skeleton className="h-3.5 w-44" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-[60px] w-full rounded-[9px]" />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-[42px] w-full rounded-[9px]" />
          ))}
        </div>
        <div className="mt-auto flex gap-2.25">
          <Skeleton className="h-[46px] flex-1 rounded-[9px]" />
          <Skeleton className="h-[46px] flex-1 rounded-[9px]" />
        </div>
      </div>
    </AppShell>
  );
}
