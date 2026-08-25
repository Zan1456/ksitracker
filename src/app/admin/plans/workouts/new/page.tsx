import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/db";
import { levels } from "@/db/schema";
import { AppShell } from "@/components/app-shell";
import { IconArrowLeft } from "@/components/icons";
import { WorkoutForm } from "@/components/admin/workout-form";
import { PageTransition } from "@/components/motion/page-transition";

export default async function NewWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ levelId?: string }>;
}) {
  await requireAdmin();
  const { levelId } = await searchParams;
  if (!levelId) notFound();

  const [level] = await db.select().from(levels).where(eq(levels.id, levelId)).limit(1);
  if (!level) notFound();

  return (
    <AppShell nav="admin">
      <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
        <Link
          href={`/admin/plans/levels/${level.id}`}
          className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border text-text-secondary"
        >
          <IconArrowLeft width={15} height={15} />
        </Link>
        <span className="text-[13.5px] font-medium text-text-secondary">
          Új edzés · Szint {level.index} · {level.name}
        </span>
      </div>
      <PageTransition className="px-5 pb-6 pt-5">
        <WorkoutForm levelId={level.id} />
      </PageTransition>
    </AppShell>
  );
}
