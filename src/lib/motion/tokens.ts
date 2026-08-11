/**
 * Shared motion tokens. Three tiers: micro-interactions (fast), component
 * transitions (medium), and hero/section transitions (slow). Keep every
 * animation on this scale instead of inventing new durations per component.
 */
export const duration = {
  fast: 0.15,
  medium: 0.35,
  slow: 0.6,
} as const;

export const ease = {
  standard: [0.16, 1, 0.3, 1] as const, // fast-out, smooth settle — no bounce
  enter: [0.22, 1, 0.36, 1] as const,
} as const;

export const stagger = {
  tight: 0.05,
  normal: 0.08,
} as const;
