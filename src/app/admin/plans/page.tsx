import Link from "next/link";
import { asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/db";
import { levels, workouts, workoutTasks } from "@/db/schema";
import { AppShell, AppHeader } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { PageTransition } from "@/components/motion/page-transition";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-list";
import { ReorderButtons } from "@/components/admin/reorder-buttons";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { reorderLevelAction, reorderWorkoutAction, deleteWorkoutAction } from "./actions";

export default async function AdminPlansPage() {
  await requireAdmin();

  const [allLevels, allWorkouts, allTasks] = await Promise.all([
    db.select().from(levels).orderBy(asc(levels.order)),
    db.select().from(workouts).orderBy(asc(workouts.order)),
    db.select().from(workoutTasks).orderBy(asc(workoutTasks.order)),
  ]);

  return (
    <AppShell nav="admin">
      <AppHeader
        title="Edzéstervek"
        right={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/plans/challenge"
              className="rounded-[7px] border border-border-strong px-2.75 py-2 text-[11.5px] font-medium text-text-secondary transition-transform active:scale-95"
            >
              Challenge
            </Link>
            <Link
              href="/admin/plans/levels/new"
              className="rounded-[7px] bg-text px-2.75 py-2 text-[11.5px] font-medium text-bg transition-transform active:scale-95"
            >
              + Új szint
            </Link>
          </div>
        }
      />

      <PageTransition className="gap-5 overflow-y-auto px-5 py-4">
        <StaggerContainer className="flex flex-col gap-5">
          {allLevels.map((level, li) => (
            <StaggerItem key={level.id}>
              <div className="mb-2.5 flex items-center gap-2.5">
                <ReorderButtons
                  disabledUp={li === 0}
                  disabledDown={li === allLevels.length - 1}
                  onUp={reorderLevelAction.bind(null, level.id, "up")}
                  onDown={reorderLevelAction.bind(null, level.id, "down")}
                />
                <Link href={`/admin/plans/levels/${level.id}`} className="flex-1">
                  <div className="text-[13.5px] font-medium">
                    Szint {level.index} · {level.name}
                  </div>
                  {level.description && (
                    <div className="mt-0.5 truncate text-[11px] text-text-muted">{level.description}</div>
                  )}
                </Link>
                <Link
                  href={`/admin/plans/workouts/new?levelId=${level.id}`}
                  className="mono shrink-0 rounded-[6px] border border-border-strong px-2 py-1.5 text-[10.5px] text-text-secondary"
                >
                  + EDZÉS
                </Link>
              </div>

              <div className="flex flex-col gap-2">
                {allWorkouts
                  .filter((w) => w.levelId === level.id)
                  .map((w, wi, arr) => {
                    const taskCount = allTasks.filter((t) => t.workoutId === w.id).length;
                    return (
                      <div
                        key={w.id}
                        className="flex items-center gap-2.5 rounded-[9px] border border-border bg-bg-elevated p-3"
                      >
                        <ReorderButtons
                          disabledUp={wi === 0}
                          disabledDown={wi === arr.length - 1}
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
                          confirmText={`Törlöd a(z) "${w.name}" edzést? Minden feladata és a hozzá tartozó felhasználói haladás is törlődik.`}
                          toastText={`${w.name} törölve`}
                          action={deleteWorkoutAction.bind(null, level.id, w.id)}
                        />
                      </div>
                    );
                  })}
                {allWorkouts.filter((w) => w.levelId === level.id).length === 0 && (
                  <p className="py-2 text-center text-[12px] text-text-faint">
                    Még nincs edzés ebben a szintben.
                  </p>
                )}
              </div>
            </StaggerItem>
          ))}

          {allLevels.length === 0 && (
            <p className="py-8 text-center text-[13px] text-text-muted">
              Még nincs egyetlen szint sem. Hozz létre egyet a „+ Új szint&rdquo; gombbal.
            </p>
          )}
        </StaggerContainer>
      </PageTransition>

      <BottomNav variant="admin" />
    </AppShell>
  );
}
