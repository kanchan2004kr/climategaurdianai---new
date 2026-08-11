import type { RiskFactor, RiskResult } from "@/lib/types/risk";
import { scoreToLevel } from "@/lib/types/risk";

export interface WaterRiskInput {
  recentRainfallMm: number; // accumulated over lookback window
  rainfallLookbackDays: number;
  activeContaminationReports: number;
  activeNoWaterReports: number;
  activeFloodingReports: number;
  operationalWaterPointRatio: number | null; // 0-1, null if no data
}

/**
 * Water Risk Score (0-100). Combines rainfall-driven flood/contamination
 * signals with citizen-reported issues and water-point availability.
 */
export function calculateWaterRisk(input: WaterRiskInput, isDemoData: boolean): RiskResult {
  const factors: RiskFactor[] = [];

  const rainRate = input.recentRainfallMm / Math.max(1, input.rainfallLookbackDays);
  const rainScore = clampScore(linearScale(rainRate, 0, 60));
  factors.push(weighted("Rainfall intensity", rainRate, 0.3, rainScore));

  const contaminationScore = clampScore(linearScale(input.activeContaminationReports, 0, 10));
  factors.push(weighted("Contamination reports", input.activeContaminationReports, 0.25, contaminationScore));

  const noWaterScore = clampScore(linearScale(input.activeNoWaterReports, 0, 10));
  factors.push(weighted("No-water reports", input.activeNoWaterReports, 0.2, noWaterScore));

  const floodingScore = clampScore(linearScale(input.activeFloodingReports, 0, 10));
  factors.push(weighted("Flooding reports", input.activeFloodingReports, 0.15, floodingScore));

  if (input.operationalWaterPointRatio != null) {
    const availabilityScore = clampScore((1 - input.operationalWaterPointRatio) * 100);
    factors.push(weighted("Water point availability", input.operationalWaterPointRatio, 0.1, availabilityScore));
  }

  const weightedSum = factors.reduce((sum, f) => sum + f.contribution, 0);
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const score = clampScore(totalWeight > 0 ? weightedSum / totalWeight : 0);

  return {
    category: "WATER",
    score: Math.round(score),
    level: scoreToLevel(score),
    factors,
    summary: `Water risk is ${scoreToLevel(score).toLowerCase()}, based on rainfall trends and citizen reports.`,
    isDemoData,
    computedAt: new Date().toISOString(),
  };
}

function weighted(label: string, value: number, weight: number, factorScore: number): RiskFactor {
  return { label, value, weight, contribution: factorScore * weight };
}

function linearScale(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 100;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}
