"use client";

import { useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { formatSeconds, formatDateHu } from "@/lib/format";
import { toast } from "@/lib/toast-store";
import { deleteSessionAction } from "@/app/admin/actions";
import { IconX } from "@/components/icons";
import type { HistoryEntry } from "@/lib/workout-data";

export function SessionHistoryList({ userId, history }: { userId: string; history: HistoryEntry[] }) {
  const [isPending, startTransition] = useTransition();

  if (history.length === 0) {
    return <p className="py-2 text-[12.5px] text-text-muted">Még nincs teljesített edzés.</p>;
  }

  return (
    <AnimatePresence initial={false}>
      {history.map((h) => (
        <motion.div
          key={h.sessionId}
          layout
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          className="flex items-center gap-2.5 border-b border-border py-2.5 text-[12.5px]"
        >
          <div className="flex-1">
            <div className="font-medium">{h.workoutName}</div>
            <div className="mono mt-0.5 text-[10px] text-text-faint">
              {formatDateHu(h.sessionDate)} · SZINT {h.levelIndex}
            </div>
          </div>
          <span className="mono text-text-secondary">
            {h.totalSeconds ? formatSeconds(h.totalSeconds) : "—"}
          </span>
          <button
            disabled={isPending}
            title="Munkamenet törlése"
            onClick={() => {
              if (!confirm("Törlöd ezt a teljesített edzést? A felhasználó haladása visszaáll.")) return;
              toast("Edzés eltávolítva a naplóból", "info");
              startTransition(() => deleteSessionAction(userId, h.sessionId));
            }}
            className="text-text-faint hover:text-danger disabled:opacity-40"
          >
            <IconX width={12} height={12} />
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
