import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/db";
import { workouts, workoutTasks, levels } from "@/db/schema";
import { AppShell } from "@/components/app-shell";
import { IconArrowLeft } from "@/components/icons";
import { WorkoutForm } from "@/components/admin/workout-form";
import { TaskManager } from "@/components/admin/task-manager";
import { PageTransition } from "@/components/motion/page-transition";

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  await requireAdmin();
  const { workoutId } = await params;

  const [workout] = await db.select().from(workouts).where(eq(workouts.id, workoutId)).limit(1);
  if (!workout) notFound();

  const [level, tasks] = await Promise.all([
    db.select().from(levels).where(eq(levels.id, workout.levelId)).limit(1).then((r) => r[0]),
    db
      .select()
      .from(workoutTasks)
      .where(eq(workoutTasks.workoutId, workoutId))
      .orderBy(asc(workoutTasks.order)),
  ]);

  return (
    <AppShell nav="admin">
      <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
        <Link
          href={`/admin/plans/levels/${workout.levelId}`}
          className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border text-text-secondary"
        >
          <IconArrowLeft width={15} height={15} />
        </Link>
        <span className="text-[13.5px] font-medium text-text-secondary">
          {level ? `Szint ${level.index} · ${level.name}` : "Edzés szerkesztése"}
        </span>
      </div>

      <PageTransition className="gap-6 overflow-y-auto px-5 pb-6 pt-5">
        <WorkoutForm workout={workout} />

        <div className="flex flex-col gap-2.5">
          <div className="mono text-[10.5px] text-text-faint">FELADATOK</div>
          <TaskManager workoutId={workout.id} tasks={tasks} />
        </div>
      </PageTransition>
    </AppShell>
  );
}
