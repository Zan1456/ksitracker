import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { getLevelsWithProgress } from "@/lib/workout-data";
import { getChallengeTasks, getOrCreateChallengeSettings, getChallengeDailyLimitInfo } from "@/lib/challenge-data";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconLock } from "@/components/icons";
import { ChallengeTaskPicker } from "@/components/challenge-task-picker";
import { PageTransition } from "@/components/motion/page-transition";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-list";

export default async function ChallengeOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ levelId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { levelId } = await params;
  const { error } = await searchParams;
  const user = await requireUser();

  const [levelsProgress, tasks, settings, limit] = await Promise.all([
    getLevelsWithProgress(user.id),
    getChallengeTasks(),
    getOrCreateChallengeSettings(),
    getChallengeDailyLimitInfo(user.id),
  ]);
  const level = levelsProgress.find((l) => l.id === levelId);
  if (!level) notFound();

  const workoutsDone = level.totalCount > 0 && level.doneCount === level.totalCount;
  const locked = level.locked || !workoutsDone;
  const isCurrentInProgress = limit.inProgressLevelId === levelId;
  const canPick = !locked && !isCurrentInProgress && limit.canStartNew && tasks.length > 0;

  return (
    <AppShell>
      <div className="glass sticky top-0 z-10 flex items-center gap-3 border-b px-5 py-3.5">
        <Link
          href="/"
          className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border text-text-secondary"
        >
          <IconArrowLeft width={15} height={15} />
        </Link>
        <span className="text-[13.5px] font-medium text-text-secondary">
          Szint {level.index} · {level.name}
        </span>
      </div>

      <PageTransition className="gap-4.5 overflow-y-auto px-5 pb-6 pt-5">
        <div>
          <h1 className="mb-2 text-[24px] font-medium leading-[1.15] tracking-[-0.03em]">Challenge</h1>
          <p className="mb-3 text-[13px] leading-[1.55] text-text-muted">
            {canPick
              ? `Válaszd ki, mely feladatokat csinálod meg — legalább ${settings.minRequired}-et a ${tasks.length}-ból. Az eredmények felkerülnek a ranglistára, és a szint lezártnak számít.`
              : `Legalább ${settings.minRequired} feladatot teljesíts a ${tasks.length}-ból — az eredmények felkerülnek a ranglistára, és a szint lezártnak számít.`}
          </p>
          {level.challengePassed && (
            <span className="mono inline-block rounded-[6px] border border-success-border bg-success-bg px-2.25 py-1.5 text-[11px] text-success">
              MÁR TELJESÍTVE · ÚJRA NEKIFUTHATSZ JOBB EREDMÉNYÉRT
            </span>
          )}
        </div>

        {canPick ? (
          <ChallengeTaskPicker
            levelId={levelId}
            tasks={tasks}
            minRequired={settings.minRequired}
            challengePassed={level.challengePassed}
            selectionError={error === "selection"}
          />
        ) : (
          <>
            <StaggerContainer className="flex flex-col gap-2">
              {tasks.map((t, i) => (
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
                    <div className="mono mt-1.25 text-[11px] text-text-faint">STOPPEREZETT · RANGLISTA</div>
                  </div>
                  <span className="mono shrink-0 text-[12px] font-medium text-warning">
                    {t.targetDistanceMeters ? `${t.targetDistanceMeters} m` : t.resultKind === "reps" ? "60 mp" : "stopper"}
                  </span>
                </StaggerItem>
              ))}
              {tasks.length === 0 && (
                <p className="py-4 text-center text-[12.5px] text-text-muted">Még nincs challenge-feladat.</p>
              )}
            </StaggerContainer>

            <div className="mt-auto pt-1">
              {locked ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-bg-inset py-3.5 text-[13px] font-medium text-text-faint">
                  <IconLock width={14} height={14} />
                  Előbb fejezd be a szint edzéseit
                </div>
              ) : isCurrentInProgress ? (
                <Link href={`/challenge/${levelId}/live`}>
                  <Button size="lg" className="w-full">
                    Folytatás
                  </Button>
                </Link>
              ) : (
                <div>
                  <Button size="lg" className="w-full" disabled>
                    {level.challengePassed ? "Challenge újra" : "Challenge indítása"}
                  </Button>
                  <p className="mt-2.25 text-center text-[11.5px] text-text-faint">
                    {tasks.length === 0
                      ? "Még nincs challenge-feladat."
                      : limit.reason === "already_in_progress"
                        ? "Egy másik challenge-próbálkozásod van folyamatban."
                        : "Ma már próbálkoztál a challenge-dzsel. Gyere vissza holnap."}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </PageTransition>
    </AppShell>
  );
}
