import { AppShell } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { Skeleton } from "@/components/skeleton";

export default function AdminLoading() {
  return (
    <AppShell nav="admin">
      <div className="border-b border-border px-5 pb-3.5 pt-3.5">
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="flex flex-col gap-2.5 px-5 pt-3.5">
        <Skeleton className="h-11 w-full rounded-lg" />
        <div className="flex gap-1.5">
          <Skeleton className="h-7 w-16 rounded-full" />
          <Skeleton className="h-7 w-16 rounded-full" />
          <Skeleton className="h-7 w-16 rounded-full" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-5 py-4">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-[60px] w-full rounded-[10px]" />
        ))}
      </div>
      <BottomNav variant="admin" />
    </AppShell>
  );
}
