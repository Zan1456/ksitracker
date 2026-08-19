"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { IconCheck } from "@/components/icons";

export function SuccessCheck() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.05 }}
      className="relative flex h-16 w-16 items-center justify-center rounded-full border border-success-border bg-success-bg text-success"
    >
      <motion.span
        initial={{ scale: 0.6, opacity: 0.6 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
        className="absolute inset-0 rounded-full border border-success"
      />
      <IconCheck width={28} height={28} strokeWidth={2.5} />
    </motion.div>
  );
}

export function FadeUp({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
