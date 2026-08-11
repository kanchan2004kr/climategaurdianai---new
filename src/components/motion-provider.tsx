"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Disables motion's automatic OS-level reduced-motion handling (which runs
 * client-only and diverges from SSR, causing hydration mismatches). Each
 * motion component instead reads `useReducedMotion()` itself and adjusts its
 * own transition — see Reveal/StaggerContainer/ClimateBackground.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="never">{children}</MotionConfig>;
}
