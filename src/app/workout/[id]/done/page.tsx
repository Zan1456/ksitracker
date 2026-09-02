import Link from "next/link";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { workoutSessions, taskResults, workoutTasks } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import { getWorkoutWithTasks } from "@/lib/workout-data";
import { formatSeconds } from "@/lib/format";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

export default async function WorkoutDonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const [[session], data] = await Promise.all([
    db
      .select()
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, user.id),
          eq(workoutSessions.workoutId, id),
          eq(workoutSessions.status, "completed")
        )
      )
      .orderBy(desc(workoutSessions.completedAt))
      .limit(1),
    getWorkoutWithTasks(id),
  ]);

  const splits = session
    ? await db
        .select({ name: workoutTasks.name, resultMs: taskResults.resultMs, order: workoutTasks.order })
        .from(taskResults)
        .innerJoin(workoutTasks, eq(taskResults.taskId, workoutTasks.id))
        .where(and(eq(taskResults.sessionId, session.id), eq(taskResults.completed, true)))
        .orderBy(asc(workoutTasks.order))
    : [];

  return (
    <AppShell background="deep">
      <div className="animate-rise flex flex-1 flex-col justify-center gap-4.5 px-6.5 pb-8">
        <div className="flex h-14.5 w-14.5 items-center justify-center rounded-full bg-accent text-[24px] font-extrabold text-accent-fg">
          ✓
        </div>
        <div>
          <h1 className="text-[36px] font-extrabold leading-[1.04] tracking-[-0.035em]">
            szép
            <br />
            munka!
          </h1>
          <p className="mt-3 text-[14px] font-medium leading-[1.5] text-white/75">
            {data?.workout.name} — a következő edzés megnyílt a szinttervben.
          </p>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-white/18 bg-white/10">
          <div className="flex items-baseline justify-between border-b border-white/10 px-5 py-4.5">
            <span className="mono text-[10.5px] tracking-[0.12em] text-white/65">TELJES IDŐ</span>
            <span className="mono text-[22px] font-semibold">
              {session?.totalSeconds != null ? formatSeconds(session.totalSeconds) : "—"}
            </span>
          </div>
          {splits.map((s) => (
            <div key={s.order} className="flex items-center border-b border-white/8 px-5 py-3.5 last:border-b-0">
              <span className="flex-1 text-[13.5px] font-semibold">{s.name}</span>
              <span className="mono text-[13.5px] font-bold text-white">
                {s.resultMs != null ? formatSeconds(Math.round(s.resultMs / 1000)) : "—"}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2.25">
          <Link href="/path">
            <Button size="lg" className="w-full">
              Szintterv
            </Button>
          </Link>
          <Link href="/leaderboard">
            <Button variant="secondary" size="lg" className="w-full">
              Ranglista
            </Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
