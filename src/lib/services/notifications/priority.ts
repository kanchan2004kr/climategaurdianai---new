import { vulnerabilityBoost } from "@/lib/services/risk-engine";
import type { VulnerabilityAdjustment } from "@/lib/types/risk";
import type { RiskFactor } from "@/lib/types/risk";

const SEVERITY_WEIGHT: Record<string, number> = {
  INFO: 10,
  WARNING: 35,
  SEVERE: 65,
  EXTREME: 90,
};

export interface AlertPriorityInput {
  severity: string;
  createdAt: string;
  isSameLocation: boolean;
  vulnerability?: VulnerabilityAdjustment;
}

export interface AlertPriorityResult {
  score: number;
  factors: RiskFactor[];
}

/** Explainable alert priority: severity + recency decay + location relevance + the same vulnerability adjustment used by the risk engine — no unexplained numbers. */
export function computeAlertPriority(input: AlertPriorityInput): AlertPriorityResult {
  const factors: RiskFactor[] = [];

  const severityScore = SEVERITY_WEIGHT[input.severity] ?? 10;
  factors.push({ label: "Severity", value: severityScore, weight: 0.55, contribution: severityScore * 0.55 });

  const ageHours = (Date.now() - new Date(input.createdAt).getTime()) / (1000 * 60 * 60);
  const recencyScore = Math.max(0, 100 - (ageHours / 24) * 100);
  factors.push({ label: "Recency", value: recencyScore, weight: 0.25, contribution: recencyScore * 0.25 });

  const locationScore = input.isSameLocation ? 100 : 0;
  factors.push({ label: "Location relevance", value: locationScore, weight: 0.1, contribution: locationScore * 0.1 });

  const vulnerabilityScore = vulnerabilityBoost(input.vulnerability) * 5; // scale ~0-100
  factors.push({ label: "Personal vulnerability", value: vulnerabilityScore, weight: 0.1, contribution: vulnerabilityScore * 0.1 });

  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const weightedSum = factors.reduce((sum, f) => sum + f.contribution, 0);
  const score = Math.round(Math.max(0, Math.min(100, totalWeight > 0 ? weightedSum / totalWeight : 0)));

  return { score, factors };
}
