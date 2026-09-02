"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { startChallengeSessionAction } from "@/app/challenge/actions";

type PickerTask = {
  id: string;
  name: string;
  note: string | null;
  targetDistanceMeters: number | null;
  resultKind: "time" | "reps";
};

/** Compact value shown next to a task row, e.g. "400 m", "60 mp", "stopper". */
function footerValue(t: PickerTask): string {
  if (t.targetDistanceMeters) return `${t.targetDistanceMeters} m`;
  return t.resultKind === "reps" ? "60 mp" : "stopper";
}

/**
 * Lets the user pick which challenge tasks they want to attempt before
 * starting a session — at least `minRequired` must be selected. Only the
 * chosen tasks are shown during the run; there's no more skipping mid-way.
 */
export function ChallengeTaskPicker({
  levelId,
  tasks,
  minRequired,
  challengePassed,
  selectionError,
}: {
  levelId: string;
  tasks: PickerTask[];
  minRequired: number;
  challengePassed: boolean;
  selectionError?: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(tasks.map((t) => t.id)));
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const canSubmit = selected.size >= minRequired;

  function submit() {
    if (!canSubmit || isPending) return;
    startTransition(() => {
      startChallengeSessionAction(levelId, Array.from(selected));
    });
  }

  return (
    <>
      <div className="mb-3 rounded-[22px] bg-accent p-4.5 text-[#0A0A0B]">
        <div className="text-[15px] font-extrabold leading-[1.3]">Ezek az idők kerülnek a ranglistára</div>
        <p className="m-0 mt-2 text-[12.5px] font-semibold leading-[1.45] text-black/72">
          A kihívás teljesítése zárja a szintet és nyitja a következőt.
        </p>
      </div>

      <div className="flex flex-col gap-2.25">
        {tasks.map((t) => {
          const on = selected.has(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              className={cn(
                "flex items-center gap-3.25 rounded-[20px] border p-3.75 text-left",
                on ? "border-white bg-white text-brand-blue" : "border-white/15 bg-white/8 text-white"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] border-[1.5px] text-[12px] font-extrabold text-[#0A0A0B]",
                  on ? "border-accent bg-accent" : "border-white/40 bg-transparent"
                )}
              >
                {on ? "✓" : ""}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-bold">{t.name}</div>
                {t.note && <div className="mt-1 truncate text-[10.5px] font-semibold opacity-70">{t.note}</div>}
              </div>
              <span className="mono shrink-0 text-[11px] font-semibold opacity-75">{footerValue(t)}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 pb-1">
        <button
          onClick={submit}
          disabled={!canSubmit || isPending}
          className={cn(
            "w-full rounded-full py-4.75 text-[16px] font-extrabold transition-colors disabled:cursor-not-allowed",
            canSubmit ? "bg-white text-brand-blue" : "bg-white/25 text-white/70"
          )}
        >
          {challengePassed ? "Challenge újra" : "Kihívás indítása"}
        </button>
        <p className={cn("mt-2.25 text-center text-[11.5px] font-semibold", canSubmit ? "text-white/60" : "text-warning")}>
          {canSubmit
            ? `${selected.size}/${tasks.length} feladat kiválasztva`
            : `Válassz ki legalább ${minRequired} feladatot (most: ${selected.size})`}
        </p>
        {selectionError && (
          <p className="mt-1.5 text-center text-[11.5px] font-semibold text-danger">
            A kiválasztás nem volt érvényes, próbáld újra.
          </p>
        )}
      </div>
    </>
  );
}
