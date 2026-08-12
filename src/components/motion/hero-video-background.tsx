"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Full-bleed autoplaying hero background video. Sits at -z-10 inside the hero's
 * isolated stacking context, so it stays behind all hero content while the
 * existing ClimateBackground remains as a subtle glow on top.
 *
 * Rendered client-side only (after mount) so the server and first client render
 * agree — this avoids a hydration mismatch, since prefers-reduced-motion isn't
 * known during SSR. When the user prefers reduced motion we render nothing,
 * leaving the calm (non-video) ClimateBackground as the backdrop.
 */
export function HeroVideoBackground() {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || shouldReduceMotion) return null;

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-background" aria-hidden="true">
      <video
        className="h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/videos/climateguardian-hero.mp4" type="video/mp4" />
      </video>
      {/* Dark overlay for text readability over the footage. */}
      <div className="absolute inset-0 bg-black/55" />
    </div>
  );
}
