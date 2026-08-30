"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
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
      <div className="flex flex-col gap-2">
        {tasks.map((t, i) => {
          const isChecked = selected.has(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              className={cn(
                "flex items-center gap-3.25 rounded-[9px] border p-3.25 text-left",
                isChecked ? "border-border-strong bg-bg-elevated" : "border-border bg-bg-inset opacity-60"
              )}
            >
              <span className="mono w-3.5 shrink-0 text-[11px] text-text-faint">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={cn(
                  "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] text-[11px]",
                  isChecked ? "border-text bg-text text-bg" : "border-border-strong text-transparent"
                )}
              >
                ✓
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-medium">{t.name}</div>
                {t.note && (
                  <div className="mt-1 text-[11.5px] leading-[1.4] text-text-muted">{t.note}</div>
                )}
              </div>
              <span className="mono shrink-0 text-[12px] font-medium text-warning">{footerValue(t)}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-1">
        <Button size="lg" className="w-full" disabled={!canSubmit || isPending} onClick={submit}>
          {challengePassed ? "Challenge újra" : "Challenge indítása"}
        </Button>
        <p className={cn("mt-2.25 text-center text-[11.5px]", canSubmit ? "text-text-faint" : "text-warning")}>
          {canSubmit
            ? `${selected.size}/${tasks.length} feladat kiválasztva`
            : `Válassz ki legalább ${minRequired} feladatot (most: ${selected.size})`}
        </p>
        {selectionError && (
          <p className="mt-1.5 text-center text-[11.5px] text-danger">
            A kiválasztás nem volt érvényes, próbáld újra.
          </p>
        )}
      </div>
    </>
  );
}
