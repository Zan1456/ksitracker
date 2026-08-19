"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { taskRowDisplay } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ReorderButtons } from "@/components/admin/reorder-buttons";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { TaskForm } from "@/components/admin/task-form";
import { Button } from "@/components/ui/button";
import { reorderTaskAction, deleteTaskAction } from "@/app/admin/plans/actions";
import type { WorkoutTask } from "@/db/schema";

export function TaskManager({ workoutId, tasks }: { workoutId: string; tasks: WorkoutTask[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {tasks.map((t, i) => {
          const row = taskRowDisplay(t);
          const isEditing = editingId === t.id;
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
                  onUp={() => reorderTaskAction(t.id, "up")}
                  onDown={() => reorderTaskAction(t.id, "down")}
                />
                <button
                  type="button"
                  onClick={() => setEditingId(isEditing ? null : t.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="truncate text-[13px] font-medium">{t.name}</div>
                  {row.subtext && (
                    <div className="mono mt-1 text-[10px] text-text-faint">{row.subtext}</div>
                  )}
                </button>
                <span
                  className={cn("mono shrink-0 text-[11.5px]", row.amber ? "text-warning" : "text-text-secondary")}
                >
                  {row.value}
                </span>
                <ConfirmDeleteButton
                  confirmText={`Törlöd a(z) "${t.name}" feladatot?`}
                  action={() => deleteTaskAction(workoutId, t.id)}
                />
              </div>

              {isEditing && (
                <div className="border-t border-border p-3.5">
                  <TaskForm task={t} onSaved={() => setEditingId(null)} />
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {tasks.length === 0 && (
        <p className="py-3 text-center text-[12.5px] text-text-muted">Még nincs feladat.</p>
      )}

      {creating ? (
        <div className="rounded-[9px] border border-border-strong bg-bg-inset p-3.5">
          <TaskForm workoutId={workoutId} onSaved={() => setCreating(false)} />
        </div>
      ) : (
        <Button variant="secondary" size="md" onClick={() => setCreating(true)}>
          + Új feladat
        </Button>
      )}
    </div>
  );
}
