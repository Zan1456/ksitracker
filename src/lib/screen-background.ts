/**
 * Per-screen background gradient, ported from the Repline design's `bgPaint`
 * logic — three fixed gradients rather than a flat color, picked by what
 * kind of screen is being shown:
 *
 * - `hero`: the splash and login screens — the brightest, most saturated blue.
 * - `deep`: screens that need to read as more serious/focused (workout and
 *   challenge detail, the live session itself, register, forgot/reset
 *   password) — black fading up into blue.
 * - `default`: everything else (home, level path, done, leaderboard,
 *   profile, all of admin) — a softer blue-to-indigo wash.
 */
export type ScreenBackgroundKind = "hero" | "deep" | "default";

const GRADIENTS: Record<ScreenBackgroundKind, string> = {
  hero: "linear-gradient(180deg,#3B2BFF 0%,#2A1CD9 100%)",
  deep: "linear-gradient(180deg,#0A0A0B 0%,#150F72 62%,#3B2BFF 100%)",
  default: "linear-gradient(180deg,#3B2BFF 0%,#2E20E0 55%,#1B12A8 100%)",
};

export function screenBackground(kind: ScreenBackgroundKind): string {
  return GRADIENTS[kind];
}
