"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Cross-fades + slightly slides the *content area* of a page on navigation
 * (header/bottom-nav chrome stays outside this and doesn't re-animate), so
 * client-side nav reads as fast *and* smooth instead of an instant jump-cut.
 */
export function PageTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] as const }}
        className={cn("flex min-h-0 flex-1 flex-col", className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
