import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { getWorkoutAccess, getWorkoutWithTasks, getDailyLimitInfo } from "@/lib/workout-data";
import { taskRowDisplay, difficultyLabel, formatMs } from "@/lib/format";
import { getLeaderboardCategories, getLeaderboard } from "@/lib/leaderboard";
import { AppShell } from "@/components/app-shell";
import { TopTabs } from "@/components/top-tabs";
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

  const [access, data, limit, categories] = await Promise.all([
    getWorkoutAccess(user.id, id),
    getWorkoutWithTasks(id),
    getDailyLimitInfo(user.id),
    getLeaderboardCategories(),
  ]);
  if (!access || !data) notFound();

  const isCurrentInProgress = limit.inProgressWorkoutId === id;

  // A workout's own stopwatch task doubles as a leaderboard category only
  // when its name happens to match one of the global challenge tasks — the
  // per-workout preview rail only makes sense to show then.
  const leaderboardTaskName = data.tasks.find((t) => categories.some((c) => c.name === t.name))?.name;
  const preview = leaderboardTaskName ? await getLeaderboard(leaderboardTaskName, "alltime") : null;

  const stats = [
    { label: "PERC", value: `~${data.workout.estimatedMinutes}` },
    { label: "FELADAT", value: String(data.tasks.length) },
    { label: "NEHÉZSÉG", value: difficultyLabel(data.workout.difficulty) },
  ];

  const ctaBlock = access.locked ? (
    <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-bg-inset py-3.5 text-[13px] font-medium text-text-faint">
      <IconLock width={14} height={14} />
      Előbb fejezd be a korábbi edzéseket
    </div>
  ) : isCurrentInProgress ? (
    <Link href={`/workout/${id}/live`}>
      <Button size="lg">Folytatás</Button>
    </Link>
  ) : (
    <form action={startSessionAction.bind(null, id)}>
      <Button type="submit" size="lg" disabled={!limit.canStartNew}>
        {access.done ? "Edzés újrakezdése" : "Edzés indítása"}
      </Button>
    </form>
  );

  const ctaHelperText =
    !limit.canStartNew || limitParam
      ? limit.reason === "already_in_progress"
        ? "Egy másik edzésed van folyamatban — előbb azt fejezd be."
        : "Elérted a napi edzéslimitet. Gyere vissza holnap, vagy kérj feloldást egy adminisztrátortól."
      : "Indítás után ma már nem választhatsz másik edzést";

  const taskRows = data.tasks.map((t, i) => {
    const row = taskRowDisplay(t);
    return (
      <div
        key={t.id}
        className={cn(
          "flex items-center gap-3.5 py-3",
          i > 0 && "border-t border-border"
        )}
      >
        <span className="mono flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border border-border bg-bg-inset text-[11px] text-text-muted">
          {i + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px]">{t.name}</div>
          {row.subtext && (
            <div className="mono mt-1.25 text-[10px] text-text-faint">{row.subtext}</div>
          )}
        </div>
        <span className={cn("mono shrink-0 text-[12.5px]", row.amber ? "text-warning" : "text-text-secondary")}>
          {row.value}
        </span>
      </div>
    );
  });

  return (
    <AppShell nav="user" wide>
      {/* Phone header. */}
      <div className="glass sticky top-0 z-10 flex items-center gap-3 border-b px-5 py-3.5 md:hidden">
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

      {/* Tablet header — tab nav on top, title row below. */}
      <div className="hidden flex-col gap-3.5 border-b border-border px-6 pb-3.5 pt-4 md:flex xl:hidden">
        <TopTabs variant="user" />
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[21px] font-medium tracking-[-0.02em]">{data.workout.name}</div>
            <div className="mono mt-2 text-[11px] text-text-faint">
              SZINT {access.level.index} · {data.tasks.length} FELADAT · ~{data.workout.estimatedMinutes} PERC
            </div>
          </div>
          <Link href="/" className="shrink-0 text-[12.5px] text-text-muted">
            ‹ Szint {access.level.index}
          </Link>
        </div>
      </div>

      {/* Desktop header — the sidebar carries navigation. */}
      <div className="hidden items-center justify-between border-b border-border px-7 py-5 xl:flex">
        <div>
          <div className="text-[22px] font-medium tracking-[-0.02em]">{data.workout.name}</div>
          <div className="mono mt-2 text-[11px] text-text-faint">
            SZINT {access.level.index} · {data.tasks.length} FELADAT · ~{data.workout.estimatedMinutes} PERC
          </div>
        </div>
        <Link href="/" className="text-[12.5px] text-text-muted">
          ‹ Szint {access.level.index}
        </Link>
      </div>

      {/* Phone body */}
      <PageTransition className="gap-4.5 overflow-y-auto px-5 pb-6 pt-5 md:hidden">
        <div>
          {data.workout.description && (
            <p className="mb-3 text-[13px] leading-[1.55] text-text-muted">
              {data.workout.description}
            </p>
          )}
          <div className="flex flex-wrap gap-1.75">
            {stats.map((s) => (
              <span
                key={s.label}
                className="mono rounded-[6px] border border-border-strong px-2.25 py-1.5 text-[11px] text-text-secondary"
              >
                {s.value} {s.label}
              </span>
            ))}
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
                  {t.note && (
                    <div className="mt-1 text-[11.5px] leading-[1.4] text-text-muted">{t.note}</div>
                  )}
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
            ctaBlock
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
              <p className="mt-2.25 text-center text-[11.5px] text-text-faint">{ctaHelperText}</p>
            </form>
          )}
        </div>
      </PageTransition>

      {/* Tablet + desktop body — hero card, stat row, task list, and an info/leaderboard rail. */}
      <div className="hidden flex-1 gap-4 overflow-y-auto px-6 py-5 md:flex xl:gap-6 xl:px-7 xl:py-6">
        <div className="flex flex-1 flex-col gap-4.5 xl:gap-5">
          <div className="flex items-end gap-6 rounded-[14px] border border-border-strong bg-bg-elevated p-6 xl:gap-7 xl:p-6.5">
            <div className="flex-1">
              <div className="mono mb-3 text-[10.5px] tracking-[0.08em] text-accent">
                SZINT {access.level.index} · {access.workout.order + 1}. EDZÉS
              </div>
              <div className="mb-2.5 text-[24px] font-medium tracking-[-0.03em] xl:text-[28px]">
                {data.workout.name}
              </div>
              {data.workout.description && (
                <p className="max-w-[460px] text-[13.5px] leading-[1.6] text-text-muted">
                  {data.workout.description}
                </p>
              )}
            </div>
            {!access.locked && ctaBlock}
          </div>

          <div className="flex gap-2.5">
            {stats.map((s) => (
              <div
                key={s.label}
                className="min-w-0 flex-1 rounded-[12px] border border-border bg-bg-elevated p-4"
              >
                <div className="mono text-[20px] tracking-[-0.02em]">{s.value}</div>
                <div className="mono mt-2.25 text-[10px] text-text-faint">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-[12px] border border-border bg-bg-elevated p-5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="mono text-[10.5px] tracking-[0.08em] text-text-faint">FELADATOK</span>
            </div>
            <div className="flex flex-col">{taskRows}</div>
          </div>

          {access.locked && <div className="mt-auto">{ctaBlock}</div>}
          {!access.locked && !isCurrentInProgress && (
            <p className="text-center text-[11.5px] text-text-faint">{ctaHelperText}</p>
          )}
        </div>

        <div className="flex w-[270px] shrink-0 flex-col gap-3.5 xl:w-[300px]">
          {preview && preview.category && preview.rows.length > 0 ? (
            <div className="rounded-[12px] border border-border bg-bg-elevated p-5">
              <div className="mono mb-3.5 text-[10.5px] tracking-[0.08em] text-text-faint">
                RANGLISTA ELŐZETES
              </div>
              <div className="flex flex-col">
                {preview.rows.slice(0, 3).map((row, i) => {
                  const isMe = row.userId === user.id;
                  return (
                    <div
                      key={row.userId}
                      className={cn("flex items-center gap-3.5 py-3", i > 0 && "border-t border-border")}
                    >
                      <span className={cn("mono w-5 text-[12px]", isMe ? "text-accent" : "text-text-faint")}>
                        {row.rank}.
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px]">{isMe ? "Te" : row.userName}</div>
                        <div className="mono mt-1.25 text-[10px] text-text-faint">
                          {isMe ? "TE · " : ""}
                          {preview.category!.name.toUpperCase()}
                        </div>
                      </div>
                      <span className="mono shrink-0 text-[12.5px] text-text-secondary">
                        {preview.category!.resultKind === "time" ? formatMs(row.value) : `${row.value} ISM`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-[12px] border border-border bg-bg-elevated p-5">
              <div className="mono mb-3.5 text-[10.5px] tracking-[0.08em] text-text-faint">TUDNIVALÓ</div>
              <p className="text-[13px] leading-[1.6] text-text-muted">
                Naponta egy edzés indítható. Ha félbehagyod, a &bdquo;Folytatás&rdquo; gombbal ugyanott
                folytathatod, ahol abbahagytad.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
