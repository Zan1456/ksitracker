import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/db";
import { levels, workouts, workoutTasks } from "@/db/schema";
import { AppShell } from "@/components/app-shell";
import { IconArrowLeft } from "@/components/icons";
import { LevelForm } from "@/components/admin/level-form";
import { ReorderButtons } from "@/components/admin/reorder-buttons";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { PageTransition } from "@/components/motion/page-transition";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-list";
import { reorderWorkoutAction, deleteWorkoutAction, deleteLevelAction } from "@/app/admin/plans/actions";

export default async function EditLevelPage({ params }: { params: Promise<{ levelId: string }> }) {
  await requireAdmin("workouts");
  const { levelId } = await params;

  const [level] = await db.select().from(levels).where(eq(levels.id, levelId)).limit(1);
  if (!level) notFound();

  const [levelWorkouts, allTasks] = await Promise.all([
    db.select().from(workouts).where(eq(workouts.levelId, levelId)).orderBy(asc(workouts.order)),
    db.select().from(workoutTasks),
  ]);

  return (
    <AppShell>
      <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
        <Link
          href="/admin/plans"
          className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border text-text-secondary"
        >
          <IconArrowLeft width={15} height={15} />
        </Link>
        <span className="text-[13.5px] font-medium text-text-secondary">
          Szint {level.index} szerkesztése
        </span>
      </div>

      <PageTransition className="gap-6 overflow-y-auto px-5 pb-6 pt-5">
        <LevelForm level={level} />

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="mono text-[10.5px] text-text-faint">EDZÉSEK</div>
            <Link
              href={`/admin/plans/workouts/new?levelId=${level.id}`}
              className="mono rounded-[6px] border border-border-strong px-2 py-1.5 text-[10.5px] text-text-secondary"
            >
              + ÚJ EDZÉS
            </Link>
          </div>

          <StaggerContainer className="flex flex-col gap-2">
            {levelWorkouts.map((w, i) => {
              const taskCount = allTasks.filter((t) => t.workoutId === w.id).length;
              return (
                <StaggerItem
                  key={w.id}
                  className="flex items-center gap-2.5 rounded-[9px] border border-border bg-bg-elevated p-3"
                >
                  <ReorderButtons
                    disabledUp={i === 0}
                    disabledDown={i === levelWorkouts.length - 1}
                    onUp={reorderWorkoutAction.bind(null, w.id, "up")}
                    onDown={reorderWorkoutAction.bind(null, w.id, "down")}
                  />
                  <Link href={`/admin/plans/workouts/${w.id}`} className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-medium">{w.name}</div>
                    <div className="mono mt-1 text-[10px] text-text-faint">
                      {taskCount} FELADAT · ~{w.estimatedMinutes} PERC
                    </div>
                  </Link>
                  <ConfirmDeleteButton
                    confirmText={`Törlöd a(z) "${w.name}" edzést?`}
                    toastText={`${w.name} törölve`}
                    action={deleteWorkoutAction.bind(null, level.id, w.id)}
                  />
                </StaggerItem>
              );
            })}
          </StaggerContainer>
          {levelWorkouts.length === 0 && (
            <p className="py-3 text-center text-[12.5px] text-text-muted">Még nincs edzés.</p>
          )}
        </div>

        <ConfirmDeleteButton
          confirmText={`Biztosan törlöd a(z) "${level.name}" szintet? Minden edzése, feladata és a hozzá tartozó felhasználói haladás is törlődik.`}
          toastText={`${level.name} szint törölve`}
          action={deleteLevelAction.bind(null, level.id)}
          label="Szint törlése"
          className="mt-2 justify-center border-t border-border pt-4 text-[12.5px] font-medium"
        />
      </PageTransition>
    </AppShell>
  );
}
