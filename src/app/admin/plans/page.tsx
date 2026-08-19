import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/db";
import { levels, workouts, workoutTasks } from "@/db/schema";
import { asc } from "drizzle-orm";
import { AppShell, AppHeader } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { taskMetaLabel } from "@/lib/format";

export default async function AdminPlansPage() {
  await requireAdmin();

  const [allLevels, allWorkouts, allTasks] = await Promise.all([
    db.select().from(levels).orderBy(asc(levels.order)),
    db.select().from(workouts).orderBy(asc(workouts.order)),
    db.select().from(workoutTasks).orderBy(asc(workoutTasks.order)),
  ]);

  return (
    <AppShell>
      <AppHeader title="Edzéstervek" />

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-4">
        {allLevels.map((level) => (
          <div key={level.id}>
            <div className="mb-2.5 text-[13.5px] font-medium">
              Szint {level.index} · {level.name}
            </div>
            <div className="flex flex-col gap-2">
              {allWorkouts
                .filter((w) => w.levelId === level.id)
                .map((w) => {
                  const tasks = allTasks.filter((t) => t.workoutId === w.id);
                  return (
                    <div key={w.id} className="rounded-[9px] border border-border bg-bg-elevated p-3.25">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[12.5px] font-medium">{w.name}</span>
                        <span className="mono text-[10px] text-text-faint">
                          {tasks.length} FELADAT · ~{w.estimatedMinutes} PERC
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {tasks.map((t) => (
                          <div key={t.id} className="flex items-center gap-2 text-[11.5px] text-text-muted">
                            <span className="flex-1 truncate">{t.name}</span>
                            <span className="mono text-[10px] text-text-faint">{taskMetaLabel(t)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      <BottomNav variant="admin" />
    </AppShell>
  );
}
