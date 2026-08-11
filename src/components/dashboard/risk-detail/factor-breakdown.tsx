"use client";

import { useEffect, useRef, useState } from "react";
import type { RiskFactor } from "@/lib/types/risk";

/** Horizontal bar per contributing factor, animated to width on mount — no hydration risk since it starts at 0 both server/client and only grows after mount. */
export function FactorBreakdown({ factors }: { factors: RiskFactor[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (factors.length === 0) {
    return <p className="text-sm text-foreground-muted">No factor breakdown available.</p>;
  }

  const maxContribution = Math.max(...factors.map((f) => f.contribution), 1);

  return (
    <div ref={containerRef} className="flex flex-col gap-3">
      {factors.map((factor) => (
        <div key={factor.label}>
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium text-foreground">{factor.label}</span>
            <span className="tabular text-foreground-muted">{factor.value.toFixed(1)}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out"
              style={{ width: animated ? `${Math.min(100, (factor.contribution / maxContribution) * 100)}%` : "0%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
