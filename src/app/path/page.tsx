import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { getLevelsWithProgress, getCurrentLevelIndex } from "@/lib/workout-data";
import { getChallengeTasks, getOrCreateChallengeSettings, getChallengeDailyLimitInfo } from "@/lib/challenge-data";
import { AppShell } from "@/components/app-shell";
import { BottomNav } from "@/components/bottom-nav";
import { IconArrowLeft } from "@/components/icons";
import { PathScreen } from "@/components/path-screen";

export default async function PathPage() {
  const user = await requireUser();

  const [levels, challengeLimit, challengeTasks, challengeSettings] = await Promise.all([
    getLevelsWithProgress(user.id),
    getChallengeDailyLimitInfo(user.id),
    getChallengeTasks(),
    getOrCreateChallengeSettings(),
  ]);

  const currentLevelIndex = getCurrentLevelIndex(levels);

  return (
    <AppShell>
      <div className="flex items-center gap-3.25 px-5.5 pb-3 pt-1.5">
        <Link
          href="/"
          aria-label="Vissza a kezdőlapra"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/16"
        >
          <IconArrowLeft width={16} height={16} strokeWidth={2} />
        </Link>
        <div className="flex-1">
          <div className="text-[22px] font-extrabold leading-[1.1] tracking-[-0.03em]">Szintterv</div>
          <div className="mono mt-2 text-[10.5px] tracking-[0.12em] text-white/65">
            EDZÉSEK SORBAN, VÉGÜL KIHÍVÁS
          </div>
        </div>
      </div>

      <PathScreen
        levels={levels}
        currentLevelIndex={currentLevelIndex}
        challengeLimitAllowed={challengeLimit.canStartNew}
        minRequired={challengeSettings.minRequired}
        poolCount={challengeTasks.length}
      />

      <BottomNav variant="user" />
    </AppShell>
  );
}
