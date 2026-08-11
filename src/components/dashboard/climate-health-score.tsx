"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "motion/react";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { Badge, riskVariant } from "@/components/ui/badge";
import type { RiskLevel } from "@/lib/types/risk";

interface ClimateHealthScoreProps {
  score: number;
  level: RiskLevel;
  summary: string;
  isDemoData: boolean;
}

const RADIUS = 72;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const LEVEL_COLOR: Record<RiskLevel, string> = {
  LOW: "var(--risk-low)",
  MODERATE: "var(--risk-moderate)",
  ELEVATED: "var(--risk-elevated)",
  HIGH: "var(--risk-high)",
  EXTREME: "var(--risk-extreme)",
};

/** Hero dashboard component: animated radial progress + count-up for the real overall risk score. */
export function ClimateHealthScore({ score, level, summary, isDemoData }: ClimateHealthScoreProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const el = circleRef.current;
    if (!el) return;

    const targetOffset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

    const controls = animate(CIRCUMFERENCE, targetOffset, {
      duration: 1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        el.style.strokeDashoffset = String(latest);
      },
    });

    setDisplayScore(score);

    return () => controls.stop();
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
      <div className="relative flex size-44 shrink-0 items-center justify-center">
        <svg viewBox="0 0 176 176" className="size-full -rotate-90">
          <circle cx="88" cy="88" r={RADIUS} fill="none" stroke="var(--border)" strokeWidth={10} />
          <circle
            ref={circleRef}
            cx="88"
            cy="88"
            r={RADIUS}
            fill="none"
            stroke={LEVEL_COLOR[level]}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE}
            style={{ filter: `drop-shadow(0 0 6px ${LEVEL_COLOR[level]}55)` }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <AnimatedNumber value={displayScore} className="tabular text-4xl font-semibold text-foreground" />
          <span className="text-xs text-foreground-muted">/ 100</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
        <div className="flex items-center gap-2">
          <Badge variant={riskVariant(level)}>{level} risk</Badge>
          {isDemoData && <Badge variant="neutral">Demo data</Badge>}
        </div>
        <h2 className="text-lg font-semibold text-foreground">Climate Health Score</h2>
        <p className="max-w-sm text-sm text-foreground-muted">{summary}</p>
      </div>
    </div>
  );
}
