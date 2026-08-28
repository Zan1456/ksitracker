export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** "1:04.8" style formatting for a stopwatch result stored in milliseconds. */
export function formatMs(ms: number): string {
  const totalTenths = Math.round(ms / 100);
  const tenths = totalTenths % 10;
  const totalSeconds = Math.floor(totalTenths / 10);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

/** "1:38" style m:ss for a countdown/duration given in seconds. */
export function formatSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** "1:38 Ó" style hours:minutes for a total duration given in minutes. */
export function formatHoursMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

const WEEKDAY_LABELS_MON_FIRST = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];

/** Monday-first weekday label ("H", "K", …) for an ISO date string. */
export function weekdayLabel(iso: string): string {
  const jsDay = new Date(iso + "T00:00:00Z").getUTCDay(); // 0 = Sunday
  const mondayFirstIndex = (jsDay + 6) % 7;
  return WEEKDAY_LABELS_MON_FIRST[mondayFirstIndex];
}

/** "09:41 MÚLVA" style — time remaining until the next UTC day starts. */
export function timeUntilNextDayLabel(): string {
  const now = new Date();
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
  );
  const diffMs = next.getTime() - now.getTime();
  const totalMinutes = Math.ceil(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} MÚLVA`;
}

/** Milliseconds remaining until the next UTC day starts. */
export function msUntilNextDay(): number {
  const now = new Date();
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0)
  );
  return next.getTime() - now.getTime();
}

/** "09:41:22" style H:MM:SS, for a live-ticking countdown. */
export function formatHMS(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function difficultyLabel(d: "easy" | "medium" | "hard"): string {
  return d === "easy" ? "KÖNNYŰ" : d === "hard" ? "NEHÉZ" : "KÖZEPES";
}

type RoundConfigLike = { work: number; restSeconds: number | null };

type TaskLike = {
  type: "reps" | "time" | "stopwatch" | "rest";
  targetReps?: number | null;
  targetSeconds?: number | null;
  targetDistanceMeters?: number | null;
  resultKind?: "time" | "reps" | null;
  rounds: number;
  roundsConfig?: RoundConfigLike[] | null;
};

/** "30-35-40" style sequence of the per-round work amounts, when customized. */
function roundWorkSequence(rounds: RoundConfigLike[]): string {
  return rounds.map((r) => r.work).join("-");
}

/** "20-15" style sequence of the per-round rest seconds, omitted when nobody has one. */
function roundRestSequence(rounds: RoundConfigLike[]): string | null {
  if (!rounds.some((r) => r.restSeconds)) return null;
  return rounds.map((r) => r.restSeconds ?? 0).join("-");
}

/** Short mono meta label for a task, e.g. "3×15 ISM", "1:30 TARTÁS", "STOPPER". */
export function taskMetaLabel(t: TaskLike): string {
  if (t.type === "reps") {
    if (t.roundsConfig?.length) return `${roundWorkSequence(t.roundsConfig)} ISM`;
    const prefix = t.rounds > 1 ? `${t.rounds}×` : "";
    return `${prefix}${t.targetReps ?? "-"} ISM`;
  }
  if (t.type === "time") {
    if (t.roundsConfig?.length) return `${roundWorkSequence(t.roundsConfig)} MP TARTÁS`;
    const prefix = t.rounds > 1 ? `${t.rounds} KÖR · ` : "";
    return `${prefix}${formatSeconds(t.targetSeconds ?? 0)} TARTÁS`;
  }
  if (t.type === "rest") return `${formatSeconds(t.targetSeconds ?? 0)} PIHENŐ`;
  if (t.resultKind === "reps") return "60 MP · AMRAP";
  if (t.targetDistanceMeters) return `${t.targetDistanceMeters} M · STOPPER`;
  return "STOPPER";
}

type FullTaskLike = TaskLike & {
  perSide?: boolean;
  restSeconds?: number | null;
};

export type TaskRowDisplay = { subtext: string | null; value: string; amber: boolean };

/** Subtext + right-aligned value for the workout-detail task row (mockup 1f). */
export function taskRowDisplay(t: FullTaskLike): TaskRowDisplay {
  if (t.type === "reps") {
    let subtext: string | null = null;
    if (t.roundsConfig?.length) {
      const rest = roundRestSequence(t.roundsConfig);
      subtext = `EGYEDI KÖRÖK · ${roundWorkSequence(t.roundsConfig)} ISM${rest ? ` · ${rest} MP SZÜNET` : ""}`;
    } else if (t.rounds > 1) {
      subtext = `${t.rounds} KÖR${t.restSeconds ? ` · ${t.restSeconds} MP SZÜNET` : ""}`;
    }
    const reps = t.targetReps ?? 0;
    const value = t.perSide ? `${reps}+${reps} db` : `${reps} db`;
    return { subtext, value, amber: false };
  }
  if (t.type === "time") {
    let subtext: string;
    if (t.roundsConfig?.length) {
      const rest = roundRestSequence(t.roundsConfig);
      subtext = `EGYEDI KÖRÖK · ${roundWorkSequence(t.roundsConfig)} MP${rest ? ` · ${rest} MP SZÜNET` : ""}`;
    } else if (t.rounds > 1) {
      subtext = `IDŐZÍTŐVEL · ${t.rounds} KÖR${t.restSeconds ? ` · ${t.restSeconds} MP SZÜNET` : ""}`;
    } else {
      subtext = "IDŐZÍTŐVEL";
    }
    return { subtext, value: formatSeconds(t.targetSeconds ?? 0), amber: true };
  }
  if (t.type === "rest") {
    return { subtext: "PIHENŐ", value: formatSeconds(t.targetSeconds ?? 0), amber: false };
  }
  // stopwatch — always leaderboard-eligible in this app
  const subtext = "STOPPEREZETT · RANGLISTA";
  const value = t.targetDistanceMeters
    ? `${t.targetDistanceMeters} m`
    : t.resultKind === "reps"
      ? "60 mp"
      : "stopper";
  return { subtext, value, amber: t.resultKind === "reps" };
}

export function formatDateHu(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
