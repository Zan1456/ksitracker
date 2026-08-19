import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { getWorkoutAccess, getWorkoutWithTasks, getDailyLimitInfo } from "@/lib/workout-data";
import { taskMetaLabel } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconCheck, IconLock } from "@/components/icons";
import { startSessionAction } from "@/app/workout/actions";

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

  const access = await getWorkoutAccess(user.id, id);
  const data = await getWorkoutWithTasks(id);
  if (!access || !data) notFound();

  const limit = await getDailyLimitInfo(user.id);
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

      <div className="flex flex-1 flex-col gap-6 px-5 pb-6 pt-5">
        <div>
          <h1 className="mb-1.5 text-[22px] font-medium leading-[1.2] tracking-[-0.03em]">
            {data.workout.name}
          </h1>
          <p className="mono text-[11px] text-text-faint">
            {data.tasks.length} FELADAT · ~{data.workout.estimatedMinutes} PERC
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {data.tasks.map((t, i) => (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-[9px] border border-border bg-bg-elevated p-3"
            >
              <span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border-strong text-[11px] text-text-muted">
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="text-[13px] font-medium">{t.name}</div>
                {t.note && <div className="mt-0.5 text-[11px] text-text-muted">{t.note}</div>}
              </div>
              <span className="mono text-[10.5px] text-text-faint">{taskMetaLabel(t)}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto">
          {access.done && (
            <div className="mb-3 flex items-center justify-center gap-2 rounded-lg border border-success-border bg-success-bg py-2.5 text-[12.5px] font-medium text-success">
              <IconCheck width={13} height={13} strokeWidth={2.5} />
              Már teljesítetted ezt az edzést — újra elvégezheted
            </div>
          )}

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
                {data.workout.name} indítása
              </Button>
              {(!limit.canStartNew || limitParam) && (
                <p className="mt-2.5 text-center text-[12px] text-text-muted">
                  {limit.reason === "already_in_progress"
                    ? "Egy másik edzésed van folyamatban — előbb azt fejezd be."
                    : "Elérted a napi edzéslimitet. Gyere vissza holnap, vagy kérj feloldást egy adminisztrátortól."}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}
