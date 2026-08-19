"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";

export function AnimatedBar({ height, className }: { height: number; className?: string }) {
  return (
    <motion.div
      initial={{ height: 0 }}
      animate={{ height }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn("w-full rounded-t-[5px]", className)}
    />
  );
}
