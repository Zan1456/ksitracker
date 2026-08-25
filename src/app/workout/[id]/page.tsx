import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { getWorkoutAccess, getWorkoutWithTasks, getDailyLimitInfo } from "@/lib/workout-data";
import { taskRowDisplay, difficultyLabel } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconLock } from "@/components/icons";
import { cn } from "@/lib/cn";
import { startSessionAction } from "@/app/workout/actions";
import { PageTransition } from "@/components/motion/page-transition";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-list";

export default async function WorkoutOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ limit?: string }>;
}) {
  const { id } = await params;
  const { limit: limitParam } = await searchParams;
  const user = await requireUser();

  const [access, data, limit] = await Promise.all([
    getWorkoutAccess(user.id, id),
    getWorkoutWithTasks(id),
    getDailyLimitInfo(user.id),
  ]);
  if (!access || !data) notFound();

  const isCurrentInProgress = limit.inProgressWorkoutId === id;

  return (
    <AppShell>
      <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
        <Link
          href="/"
          className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border text-text-secondary"
        >
          <IconArrowLeft width={15} height={15} />
        </Link>
        <span className="text-[13.5px] font-medium text-text-secondary">
          Szint {access.level.index} · {access.level.name}
        </span>
      </div>

      <PageTransition className="gap-4.5 overflow-y-auto px-5 pb-6 pt-5">
        <div>
          <h1 className="mb-2 text-[24px] font-medium leading-[1.15] tracking-[-0.03em]">
            {data.workout.name}
          </h1>
          {data.workout.description && (
            <p className="mb-3 text-[13px] leading-[1.55] text-text-muted">
              {data.workout.description}
            </p>
          )}
          <div className="flex flex-wrap gap-1.75">
            <span className="mono rounded-[6px] border border-border-strong px-2.25 py-1.5 text-[11px] text-text-secondary">
              {data.tasks.length} FELADAT
            </span>
            <span className="mono rounded-[6px] border border-border-strong px-2.25 py-1.5 text-[11px] text-text-secondary">
              ~{data.workout.estimatedMinutes} PERC
            </span>
            <span className="mono rounded-[6px] border border-border-strong px-2.25 py-1.5 text-[11px] text-text-secondary">
              {difficultyLabel(data.workout.difficulty)}
            </span>
          </div>
        </div>

        <StaggerContainer className="flex flex-col gap-2">
          {data.tasks.map((t, i) => {
            const row = taskRowDisplay(t);
            return (
              <StaggerItem
                key={t.id}
                className="flex items-center gap-3.25 rounded-[9px] border border-border bg-bg-elevated p-3.25"
              >
                <span className="mono w-3.5 shrink-0 text-[11px] text-text-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-medium">{t.name}</div>
                  {row.subtext && (
                    <div className="mono mt-1.25 text-[11px] text-text-faint">{row.subtext}</div>
                  )}
                </div>
                <span
                  className={cn(
                    "mono shrink-0 text-[12px] font-medium",
                    row.amber ? "text-warning" : "text-text-secondary"
                  )}
                >
                  {row.value}
                </span>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        <div className="mt-auto pt-1">
          {access.locked ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-bg-inset py-3.5 text-[13px] font-medium text-text-faint">
              <IconLock width={14} height={14} />
              Előbb fejezd be a korábbi edzéseket
            </div>
          ) : isCurrentInProgress ? (
            <Link href={`/workout/${id}/live`}>
              <Button size="lg" className="w-full">
                Folytatás
              </Button>
            </Link>
          ) : (
            <form action={startSessionAction.bind(null, id)}>
              <Button type="submit" size="lg" className="w-full" disabled={!limit.canStartNew}>
                {access.done ? "Edzés újrakezdése" : "Edzés indítása"}
              </Button>
              <p className="mt-2.25 text-center text-[11.5px] text-text-faint">
                {!limit.canStartNew || limitParam
                  ? limit.reason === "already_in_progress"
                    ? "Egy másik edzésed van folyamatban — előbb azt fejezd be."
                    : "Elérted a napi edzéslimitet. Gyere vissza holnap, vagy kérj feloldást egy adminisztrátortól."
                  : "Indítás után ma már nem választhatsz másik edzést"}
              </p>
            </form>
          )}
        </div>
      </PageTransition>
    </AppShell>
  );
}
