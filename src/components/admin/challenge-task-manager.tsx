"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ReorderButtons } from "@/components/admin/reorder-buttons";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { ChallengeTaskForm, type ChallengeTaskPrefill } from "@/components/admin/challenge-task-form";
import { Button } from "@/components/ui/button";
import { reorderChallengeTaskAction, deleteChallengeTaskAction } from "@/app/admin/plans/challenge-actions";
import type { ChallengeTask } from "@/db/schema";
import type { LiftableWorkoutTask } from "@/lib/challenge-data";

/** Turns an existing workout task into a starting point for a new challenge task. */
function toPrefill(t: LiftableWorkoutTask): ChallengeTaskPrefill {
  if (t.type === "stopwatch") {
    return {
      name: t.name,
      note: t.note,
      targetDistanceMeters: t.targetDistanceMeters,
      rankDirection: t.rankDirection ?? "desc",
      resultKind: t.resultKind ?? "time",
    };
  }
  // Plain "reps"/"time" workout tasks have no leaderboard config of their
  // own — default to the more-is-better direction and carry the type over
  // as the result kind; the admin can still adjust both before saving.
  return {
    name: t.name,
    note: t.note,
    targetDistanceMeters: null,
    rankDirection: "desc",
    resultKind: t.type === "time" ? "time" : "reps",
  };
}

function WorkoutTaskPicker({
  tasks,
  onPick,
  onCancel,
}: {
  tasks: LiftableWorkoutTask[];
  onPick: (t: LiftableWorkoutTask) => void;
  onCancel: () => void;
}) {
  const groups: { key: string; label: string; tasks: LiftableWorkoutTask[] }[] = [];
  for (const t of tasks) {
    const key = `${t.levelIndex}·${t.workoutName}`;
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, label: `Szint ${t.levelIndex} · ${t.workoutName}`, tasks: [] };
      groups.push(group);
    }
    group.tasks.push(t);
  }

  return (
    <div className="rounded-[9px] border border-border-strong bg-bg-inset p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[13px] font-medium">Válassz egy edzésfeladatot</span>
        <button type="button" onClick={onCancel} className="text-[12px] text-text-faint">
          Mégse
        </button>
      </div>
      {tasks.length === 0 ? (
        <p className="py-2 text-[12.5px] text-text-muted">Nincs átemelhető feladat az edzéstervekben.</p>
      ) : (
        <div className="flex max-h-[340px] flex-col gap-3 overflow-y-auto">
          {groups.map((g) => (
            <div key={g.key} className="flex flex-col gap-1">
              <div className="mono text-[10px] text-text-faint">{g.label.toUpperCase()}</div>
              {g.tasks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onPick(t)}
                  className="flex items-center gap-2.5 rounded-lg border border-border bg-bg-elevated px-2.75 py-2 text-left"
                >
                  <span className="min-w-0 flex-1 truncate text-[12.5px]">{t.name}</span>
                  <span className="mono shrink-0 text-[10.5px] text-text-faint">
                    {t.type === "reps" ? "ismétlés" : t.type === "time" ? "idő" : "stopper"}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ChallengeTaskManager({
  tasks,
  liftableTasks,
}: {
  tasks: ChallengeTask[];
  liftableTasks: LiftableWorkoutTask[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [picking, setPicking] = useState(false);
  const [liftPrefill, setLiftPrefill] = useState<ChallengeTaskPrefill | null>(null);

  function resetCreateFlow() {
    setCreating(false);
    setPicking(false);
    setLiftPrefill(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {tasks.map((t, i) => {
          const isEditing = editingId === t.id;
          const value = t.targetDistanceMeters
            ? `${t.targetDistanceMeters} m`
            : t.resultKind === "reps"
              ? "60 mp · AMRAP"
              : "stopper";
          return (
            <motion.div
              key={t.id}
              layout
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="rounded-[9px] border border-border bg-bg-elevated"
            >
              <div className="flex items-center gap-2.5 p-3">
                <ReorderButtons
                  disabledUp={i === 0}
                  disabledDown={i === tasks.length - 1}
                  onUp={() => reorderChallengeTaskAction(t.id, "up")}
                  onDown={() => reorderChallengeTaskAction(t.id, "down")}
                />
                <button
                  type="button"
                  onClick={() => setEditingId(isEditing ? null : t.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="truncate text-[13px] font-medium">{t.name}</div>
                  {t.note && (
                    <div className="mt-0.75 truncate text-[11.5px] text-text-muted">{t.note}</div>
                  )}
                  <div className="mono mt-1 text-[10px] text-text-faint">
                    RANGLISTA · {t.rankDirection === "asc" ? "kisebb jobb" : "nagyobb jobb"}
                  </div>
                </button>
                <span className="mono shrink-0 text-[11.5px] text-text-secondary">{value}</span>
                <ConfirmDeleteButton
                  confirmText={`Törlöd a(z) "${t.name}" challenge-feladatot?`}
                  action={() => deleteChallengeTaskAction(t.id)}
                />
              </div>

              {isEditing && (
                <div className="border-t border-border p-3.5">
                  <ChallengeTaskForm task={t} onSaved={() => setEditingId(null)} />
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {tasks.length === 0 && (
        <p className="py-3 text-center text-[12.5px] text-text-muted">Még nincs challenge-feladat.</p>
      )}

      {picking ? (
        <WorkoutTaskPicker
          tasks={liftableTasks}
          onCancel={resetCreateFlow}
          onPick={(t) => {
            setLiftPrefill(toPrefill(t));
            setPicking(false);
          }}
        />
      ) : creating || liftPrefill ? (
        <div className="rounded-[9px] border border-border-strong bg-bg-inset p-3.5">
          <ChallengeTaskForm prefill={liftPrefill ?? undefined} onSaved={resetCreateFlow} />
        </div>
      ) : (
        <div className="flex gap-2">
          <Button variant="secondary" size="md" className="flex-1" onClick={() => setCreating(true)}>
            + Új challenge-feladat
          </Button>
          <Button variant="secondary" size="md" className="flex-1" onClick={() => setPicking(true)}>
            + Átemelés edzésből
          </Button>
        </div>
      )}
    </div>
  );
}
