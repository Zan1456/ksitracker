"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * App-wide motion defaults. `reducedMotion="user"` makes every `motion/react`
 * animation in the app automatically collapse to instant, non-transform
 * changes when the OS "reduce motion" setting is on — without every
 * component having to check `useReducedMotionConfig()` itself.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
