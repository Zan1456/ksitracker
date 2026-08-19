import { Skeleton } from "@/components/skeleton";

export default function WorkoutLiveLoading() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col">
      <div className="flex items-center justify-between px-5 pb-3 pt-3.5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="h-[3px] bg-border" />

      <div className="flex flex-1 flex-col items-center justify-center gap-4.5 px-6 py-6">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-[236px] w-[236px] rounded-full" />
        <Skeleton className="h-5 w-40" />
      </div>

      <div className="flex flex-col gap-2 border-t border-border px-5 pb-4 pt-4">
        <Skeleton className="h-3 w-20" />
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>
    </div>
  );
}
