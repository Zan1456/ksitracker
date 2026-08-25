import { AppShell, BrandMark } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { Skeleton } from "@/components/skeleton";

export default function HomeLoading() {
  return (
    <AppShell nav="user">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <BrandMark />
        <div className="flex items-center gap-2.25">
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-7 w-7 rounded-full" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4.5 px-5 pb-6 pt-4.5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>

        {[0, 1, 2].map((l) => (
          <div key={l} className="flex flex-col gap-2.25">
            <Skeleton className="h-4 w-32" />
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-[54px] w-full rounded-[9px]" />
              ))}
            </div>
          </div>
        ))}
      </div>

      <BottomNav variant="user" />
    </AppShell>
  );
}
