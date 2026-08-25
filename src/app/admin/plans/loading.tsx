import { AppShell, AppHeader } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { Skeleton } from "@/components/skeleton";

export default function AdminPlansLoading() {
  return (
    <AppShell nav="admin">
      <AppHeader title="Edzéstervek" />
      <div className="flex flex-1 flex-col gap-5 px-5 py-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2.5">
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: 2 }, (_, j) => (
              <Skeleton key={j} className="h-[74px] w-full rounded-[9px]" />
            ))}
          </div>
        ))}
      </div>
      <BottomNav variant="admin" />
    </AppShell>
  );
}
