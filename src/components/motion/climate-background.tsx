"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Atmospheric hero backdrop: a couple of slow-drifting glow fields plus thin
 * wind-flow lines. Deliberately sparse (few DOM nodes, transform/opacity only,
 * no canvas or particle system) so it stays cheap on low-powered devices.
 */
export function ClimateBackground() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(45,212,191,0.16), transparent 45%), radial-gradient(circle at 85% 75%, rgba(45,212,191,0.10), transparent 50%)",
        }}
      />

      <motion.div
        className="absolute -left-24 top-1/4 size-[420px] rounded-full bg-brand/10 blur-3xl"
        animate={shouldReduceMotion ? { x: 0, y: 0 } : { x: [0, 40, 0], y: [0, 20, 0] }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 26, repeat: Infinity, ease: "easeInOut" }}
        suppressHydrationWarning
      />
      <motion.div
        className="absolute right-0 top-1/2 size-[360px] rounded-full bg-brand/10 blur-3xl"
        animate={shouldReduceMotion ? { x: 0, y: 0 } : { x: [0, -30, 0], y: [0, -25, 0] }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 32, repeat: Infinity, ease: "easeInOut" }}
        suppressHydrationWarning
      />

      <svg className="absolute inset-0 h-full w-full opacity-[0.25]" preserveAspectRatio="none" viewBox="0 0 1200 800">
        {[140, 280, 420, 560].map((y, i) => (
          <motion.path
            key={y}
            d={`M -100 ${y} C 250 ${y - 40}, 550 ${y + 40}, 900 ${y - 20} S 1300 ${y + 10}, 1400 ${y}`}
            stroke="currentColor"
            className="text-brand"
            strokeWidth={1}
            fill="none"
            strokeDasharray="6 10"
            animate={shouldReduceMotion ? { strokeDashoffset: 0 } : { strokeDashoffset: [0, -160] }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 14 + i * 3, repeat: Infinity, ease: "linear" }}
            suppressHydrationWarning
          />
        ))}
      </svg>

      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(45,212,191,0.35) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}
