"use client";

import { useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";

const subscribe = () => () => {};

/**
 * Full-bleed hero background video. Sits at -z-10 inside the hero's isolated
 * stacking context, so it stays behind all hero content while the existing
 * ClimateBackground remains as a subtle glow on top.
 *
 * Client-mount gated (via useSyncExternalStore: false on the server/first render,
 * true after hydration) so the autoplay/loop attributes — which depend on
 * prefers-reduced-motion, unknown during SSR — never cause a hydration mismatch.
 *
 * Accessibility: the imagery always shows, but we only autoplay/loop when the
 * user hasn't asked for reduced motion. Under reduced motion the video stays
 * paused on its first frame — visible, but with no movement.
 */
export function HeroVideoBackground() {
  const shouldReduceMotion = useReducedMotion();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-background" aria-hidden="true">
      <video
        className="h-full w-full object-cover"
        autoPlay={!shouldReduceMotion}
        muted
        loop={!shouldReduceMotion}
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
