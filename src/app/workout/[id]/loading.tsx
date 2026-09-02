import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/skeleton";

export default function WorkoutLoading() {
  return (
    <AppShell>
      <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
        <Skeleton className="h-[30px] w-[30px] rounded-lg" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="flex flex-1 flex-col gap-4.5 px-5 pb-6 pt-5">
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="mt-1 flex gap-1.75">
            <Skeleton className="h-7 w-20 rounded-[6px]" />
            <Skeleton className="h-7 w-20 rounded-[6px]" />
            <Skeleton className="h-7 w-20 rounded-[6px]" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-[54px] w-full rounded-[9px]" />
          ))}
        </div>

        <Skeleton className="mt-auto h-[52px] w-full rounded-lg" />
      </div>
    </AppShell>
  );
}
