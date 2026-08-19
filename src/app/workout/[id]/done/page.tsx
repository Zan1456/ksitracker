import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { workoutSessions } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import { getWorkoutWithTasks } from "@/lib/workout-data";
import { formatSeconds } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { IconCheck } from "@/components/icons";

export default async function WorkoutDonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const [session] = await db
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
    .limit(1);

  const data = await getWorkoutWithTasks(id);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col items-center justify-center gap-6 px-7 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-success-border bg-success-bg text-success">
        <IconCheck width={28} height={28} strokeWidth={2.5} />
      </div>
      <div>
        <h1 className="mb-1.5 text-[24px] font-medium tracking-[-0.03em]">Edzés kész!</h1>
        <p className="text-[14px] text-text-muted">{data?.workout.name}</p>
      </div>
      {session?.totalSeconds && (
        <div className="mono text-[13px] text-text-faint">
          Teljes idő: {formatSeconds(session.totalSeconds)}
        </div>
      )}
      <div className="mt-2 flex w-full flex-col gap-2.5">
        <Link href="/">
          <Button size="lg" className="w-full">
            Vissza a kezdőlapra
          </Button>
        </Link>
        <Link href="/leaderboard">
          <Button variant="secondary" size="lg" className="w-full">
            Ranglista megtekintése
          </Button>
        </Link>
      </div>
    </div>
  );
}
