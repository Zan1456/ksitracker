import { requireAdmin } from "@/lib/auth-helpers";
import { getChallengeTasks, getOrCreateChallengeSettings, getLiftableWorkoutTasks } from "@/lib/challenge-data";
import { AppShell, AppHeader } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { PageTransition } from "@/components/motion/page-transition";
import { ChallengeTaskManager } from "@/components/admin/challenge-task-manager";
import { ChallengeSettingsForm } from "@/components/admin/challenge-settings-form";

export default async function AdminChallengePage() {
  await requireAdmin();

  const [tasks, settings, liftableTasks] = await Promise.all([
    getChallengeTasks(),
    getOrCreateChallengeSettings(),
    getLiftableWorkoutTasks(),
  ]);

  return (
    <AppShell nav="admin">
      <AppHeader title="Challenge" />

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
