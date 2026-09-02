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
          <div className="truncate text-[20px] font-extrabold leading-[1.1] tracking-[-0.02em]">
            {level.name} szintzáró
          </div>
          <div className="mono mt-2 text-[10.5px] tracking-[0.12em] text-white/65">
            VÁLASSZ LEGALÁBB {settings.minRequired} FELADATOT
            {canPick ? "" : ` · ${tasks.length} ELÉRHETŐ`}
          </div>
        </div>
      </div>

      <PageTransition className="gap-4.5 overflow-y-auto px-5.5 pb-8">
        {level.challengePassed && (
          <span className="mono inline-block w-fit rounded-full border border-success-border bg-success-bg px-3 py-1.5 text-[10.5px] font-bold text-success">
            MÁR TELJESÍTVE · ÚJRA NEKIFUTHATSZ JOBB EREDMÉNYÉRT
          </span>
        )}

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
            <StaggerContainer className="flex flex-col gap-2.25">
              {tasks.map((t) => (
                <StaggerItem
                  key={t.id}
                  className="flex items-center gap-3.25 rounded-[20px] border border-white/15 bg-white/8 p-3.75"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-bold">{t.name}</div>
                    {t.note && <div className="mt-1 truncate text-[10.5px] font-semibold opacity-65">{t.note}</div>}
                  </div>
                  <span className="mono shrink-0 text-[11px] font-semibold text-warning">
                    {t.targetDistanceMeters ? `${t.targetDistanceMeters} m` : t.resultKind === "reps" ? "60 mp" : "stopper"}
                  </span>
                </StaggerItem>
              ))}
              {tasks.length === 0 && (
                <p className="py-4 text-center text-[12.5px] font-semibold text-white/60">
                  Még nincs kihívás-feladat.
                </p>
              )}
            </StaggerContainer>

            <div className="mt-auto pt-1">
              {locked ? (
                <div className="flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/8 py-4 text-[13px] font-bold text-white/60">
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
                    {level.challengePassed ? "Kihívás újra" : "Kihívás indítása"}
                  </Button>
                  <p className="mt-2.25 text-center text-[11.5px] font-semibold text-white/60">
                    {tasks.length === 0
                      ? "Még nincs kihívás-feladat."
                      : limit.reason === "already_in_progress"
                        ? "Egy másik kihívás-próbálkozásod van folyamatban."
                        : "Ma már próbálkoztál a kihívással. Gyere vissza holnap."}
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
