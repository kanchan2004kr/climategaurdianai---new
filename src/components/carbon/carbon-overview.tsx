"use client";

import { useEffect, useRef } from "react";
import { animate } from "motion/react";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CarbonSummary } from "@/lib/services/carbon";

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function greenScoreColor(score: number): string {
  if (score >= 70) return "var(--risk-low)";
  if (score >= 40) return "var(--risk-moderate)";
  return "var(--risk-high)";
}

export function CarbonOverview({
  summary,
  topCategoryLabel,
}: {
  summary: CarbonSummary;
  topCategoryLabel: string | null;
}) {
  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const el = circleRef.current;
    if (!el) return;
    const targetOffset = CIRCUMFERENCE - (summary.greenScore / 100) * CIRCUMFERENCE;
    const controls = animate(CIRCUMFERENCE, targetOffset, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        el.style.strokeDashoffset = String(latest);
      },
    });
    return () => controls.stop();
  }, [summary.greenScore]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-foreground-muted">Current footprint (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatedNumber value={summary.totalCo2eKg} decimals={1} suffix=" kg CO₂e" className="tabular text-3xl font-semibold text-foreground" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-foreground-muted">Green score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative flex size-24 items-center justify-center">
            <svg viewBox="0 0 120 120" className="size-full -rotate-90">
              <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="var(--border)" strokeWidth={8} />
              <circle
                ref={circleRef}
                cx="60"
                cy="60"
                r={RADIUS}
                fill="none"
                stroke={greenScoreColor(summary.greenScore)}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE}
              />
            </svg>
            <AnimatedNumber value={summary.greenScore} className="tabular absolute text-xl font-semibold text-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-foreground-muted">Top emission source</CardTitle>
        </CardHeader>
        <CardContent>
          {topCategoryLabel ? (
            <p className="text-2xl font-semibold text-foreground">{topCategoryLabel}</p>
          ) : (
            <p className="text-sm text-foreground-muted">No entries yet — add one below.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
