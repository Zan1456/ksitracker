import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";
import { getChallengeTasks, getOrCreateChallengeSettings, getLiftableWorkoutTasks } from "@/lib/challenge-data";
import { AppShell } from "@/components/app-shell";
import { IconArrowLeft } from "@/components/icons";
import { BottomNav } from "@/components/bottom-nav";
import { PageTransition } from "@/components/motion/page-transition";
import { ChallengeTaskManager } from "@/components/admin/challenge-task-manager";
import { ChallengeSettingsForm } from "@/components/admin/challenge-settings-form";

export default async function AdminChallengePage() {
  await requireAdmin("workouts");

  const [tasks, settings, liftableTasks] = await Promise.all([
    getChallengeTasks(),
    getOrCreateChallengeSettings(),
    getLiftableWorkoutTasks(),
  ]);

  return (
    <AppShell>
      {/* Reached from Edzéstervek, not a sidebar/bottom-nav destination of its
          own — same back-arrow drill-down header as the level/workout forms. */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
        <Link
          href="/admin/plans"
          className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-border text-text-secondary"
        >
          <IconArrowLeft width={15} height={15} />
        </Link>
        <span className="text-[13.5px] font-medium text-text-secondary">Challenge</span>
      </div>

      <PageTransition className="gap-5 overflow-y-auto px-5 py-4">
        <p className="text-[12.5px] leading-[1.5] text-text-muted">
          Ez a lista minden szint végén ugyanúgy megjelenik. A feladatok automatikusan bekerülnek a
          ranglistába — a felhasználónak nem kell mindet teljesítenie, csak a lent megadott minimumot
          ahhoz, hogy a szint lezártnak számítson és a következő szint feloldódjon.
        </p>

        <ChallengeSettingsForm minRequired={settings.minRequired} taskCount={tasks.length} />

        <ChallengeTaskManager tasks={tasks} liftableTasks={liftableTasks} />
      </PageTransition>

      <BottomNav variant="admin" />
    </AppShell>
  );
}
