"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
  /** Seconds; defaults to a value proportional to the size of the change. */
  duration?: number;
}

/**
 * Animates a numeric display from its previous value to `value`. Represents
 * a real, already-computed number — never invents or fakes intermediate data.
 */
export function AnimatedNumber({ value, decimals = 0, className, suffix = "", prefix = "", duration }: AnimatedNumberProps) {
  const shouldReduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    if (shouldReduceMotion) {
      // Reduced-motion users get the final value immediately; this doesn't
      // cascade further renders since `value` is the effect's only dependency.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplay(value);
      previous.current = value;
      return;
    }

    const from = previous.current;
    const controls = animate(from, value, {
      duration: duration ?? 0.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(latest),
    });

    previous.current = value;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, shouldReduceMotion]);

  return (
    <span className={className}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
