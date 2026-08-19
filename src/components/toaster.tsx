"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { subscribeToasts, getToasts, dismissToast } from "@/lib/toast-store";
import { IconCheck, IconX } from "@/components/icons";
import { cn } from "@/lib/cn";

export function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, () => []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-[520px] flex-col items-center gap-2 px-5 pb-[calc(env(safe-area-inset-bottom)+84px)]">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => dismissToast(t.id)}
            className={cn(
              "pointer-events-auto flex w-full items-center gap-2.5 rounded-[10px] border px-3.5 py-3 text-[13px] font-medium shadow-lg backdrop-blur",
              t.variant === "success" && "border-success-border bg-success-bg text-success",
              t.variant === "error" && "border-danger-border bg-danger-bg text-danger",
              t.variant === "info" && "border-border-strong bg-bg-inset text-text"
            )}
          >
            {t.variant === "success" && <IconCheck width={14} height={14} strokeWidth={2.5} />}
            {t.variant === "error" && <IconX width={13} height={13} strokeWidth={2.5} />}
            <span className="flex-1">{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
