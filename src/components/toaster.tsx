"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { subscribeToasts, getToasts, dismissToast } from "@/lib/toast-store";

const EMPTY: never[] = [];
function getEmptySnapshot() {
  return EMPTY;
}

/**
 * A single white pill, matching the Repline design's `flash()` toast —
 * floats above the bottom nav, optionally offering an "Visszavonás" (undo)
 * action next to the message.
 */
export function Toaster() {
  // Stable references (module-level function + constant) so React doesn't
  // warn about an uncached snapshot on every render.
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getEmptySnapshot);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[96px] z-50 mx-auto flex w-[calc(100%-40px)] max-w-[calc(520px-40px)] flex-col items-center gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto flex w-full items-center gap-3 rounded-[18px] bg-white px-4.5 py-3.5 text-[12.5px] font-bold text-[#0A0A0B] shadow-[0_12px_30px_rgba(0,0,0,.35)]"
          >
            <span className="flex-1">{t.message}</span>
            {t.undo ? (
              <button
                onClick={() => {
                  dismissToast(t.id);
                  t.undo!.action();
                }}
                className="shrink-0 rounded-full bg-[#0A0A0B] px-3 py-2 text-[11.5px] font-bold text-white"
              >
                {t.undo.label ?? "Visszavonás"}
              </button>
            ) : (
              <button
                onClick={() => dismissToast(t.id)}
                aria-label="Bezárás"
                className="shrink-0 text-[13px] text-[#0A0A0B]/50"
              >
                ✕
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
