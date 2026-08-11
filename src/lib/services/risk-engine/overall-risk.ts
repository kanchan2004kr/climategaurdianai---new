import type { RiskFactor, RiskResult } from "@/lib/types/risk";
import { scoreToLevel } from "@/lib/types/risk";

export interface OverallRiskInputs {
  air: RiskResult;
  heat: RiskResult;
  water: RiskResult;
  diseaseScore: number; // max of dengue/malaria suitability, 0-100
  disasterScore: number; // max across disaster items, 0-100
}

const CATEGORY_WEIGHTS = {
  air: 0.25,
  heat: 0.25,
  water: 0.15,
  disease: 0.15,
  disaster: 0.2,
} as const;

/** Combines all category risk scores into a single overall Climate Risk Score. */
export function calculateOverallRisk(inputs: OverallRiskInputs): RiskResult {
  const factors: RiskFactor[] = [
    weighted("Air Risk", inputs.air.score, CATEGORY_WEIGHTS.air),
    weighted("Heat Risk", inputs.heat.score, CATEGORY_WEIGHTS.heat),
    weighted("Water Risk", inputs.water.score, CATEGORY_WEIGHTS.water),
    weighted("Disease Environmental Risk", inputs.diseaseScore, CATEGORY_WEIGHTS.disease),
    weighted("Disaster Risk", inputs.disasterScore, CATEGORY_WEIGHTS.disaster),
  ];

  const weightedSum = factors.reduce((sum, f) => sum + f.contribution, 0);
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const score = clampScore(totalWeight > 0 ? weightedSum / totalWeight : 0);

  const isDemoData = inputs.air.isDemoData || inputs.heat.isDemoData || inputs.water.isDemoData;

  return {
    category: "OVERALL",
    score: Math.round(score),
    level: scoreToLevel(score),
    factors,
    summary: `Overall climate risk is ${scoreToLevel(score).toLowerCase()}, combining air, heat, water, disease-environmental and disaster indicators.`,
    isDemoData,
    computedAt: new Date().toISOString(),
  };
}

function weighted(label: string, value: number, weight: number): RiskFactor {
  return { label, value, weight, contribution: value * weight };
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}
