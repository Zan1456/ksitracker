import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { getWorkoutAccess, getWorkoutWithTasks, getDailyLimitInfo } from "@/lib/workout-data";
import { taskRowDisplay } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconLock } from "@/components/icons";
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
  const ctaHelperText =
    !limit.canStartNew || limitParam
      ? limit.reason === "already_in_progress"
        ? "Egy másik edzésed van folyamatban — előbb azt fejezd be."
        : "Elérted a napi edzéslimitet. Gyere vissza holnap, vagy kérj feloldást egy adminisztrátortól."
      : "Indítás után ma már nem választhatsz másik edzést";

  return (
    <AppShell background="deep">
      <div className="flex items-center gap-3.25 px-5.5 pb-3 pt-1.5">
        <Link
          href="/path"
          aria-label="Vissza a szinttervhez"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/16"
        >
          <IconArrowLeft width={16} height={16} strokeWidth={2} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[19px] font-extrabold leading-[1.1] tracking-[-0.02em]">
            {data.workout.name}
          </div>
          <div className="mono mt-2 text-[10.5px] tracking-[0.12em] text-white/65">
            {access.level.name.toUpperCase()} · {data.tasks.length} FELADAT · {data.workout.estimatedMinutes} PERC
          </div>
        </div>
      </div>

      <PageTransition className="gap-3.5 overflow-y-auto px-5.5 pb-8">
        <div className="shrink-0 overflow-hidden rounded-[24px] border border-white/15 bg-white/8">
          <StaggerContainer>
            {data.tasks.map((t, i) => {
              const row = taskRowDisplay(t);
              const meta = row.subtext ? `${row.value} · ${row.subtext}` : row.value;
              return (
                <StaggerItem
                  key={t.id}
                  className="flex items-center gap-3.25 border-b border-white/8 p-4 last:border-b-0"
                >
                  <span className="mono flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-white/16 text-[11px] font-bold">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-bold">{t.name}</div>
                    <div className="mono mt-1.75 truncate text-[10.5px] tracking-[0.04em] text-white/70">
                      {meta}
                    </div>
                  </div>
                  {row.amber && (
                    <span className="mono shrink-0 rounded-[8px] bg-accent px-2.25 py-1.5 text-[9.5px] font-bold tracking-[0.06em] text-accent-fg">
                      IDŐRE
                    </span>
                  )}
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>

        <div className="shrink-0 rounded-[24px] border border-white/13 bg-white/6 p-4.5">
          <div className="mono mb-2.5 text-[10.5px] tracking-[0.14em] text-white/60">MIÉRT SORBAN?</div>
          <p className="m-0 text-[12.5px] font-semibold leading-[1.5] text-white/78">
            A szint edzései egymásra épülnek, ezért csak sorrendben nyílnak meg. Az utolsó után jön a szintzáró
            kihívás — csak annak az idői kerülnek a ranglistára.
          </p>
        </div>

        <div className="mt-auto shrink-0 pt-1">
          {access.locked ? (
            <div className="flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/8 py-4 text-[13px] font-bold text-white/60">
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
              <p className="mt-2.25 text-center text-[11.5px] font-semibold text-white/60">{ctaHelperText}</p>
            </form>
          )}
        </div>
      </PageTransition>
    </AppShell>
  );
}
