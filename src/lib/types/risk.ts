export type RiskCategory = "AIR" | "HEAT" | "WATER" | "DISEASE" | "DISASTER" | "OVERALL";
export type RiskLevel = "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "EXTREME";

export interface RiskFactor {
  label: string;
  value: number;
  weight: number;
  contribution: number;
}

export interface RiskResult {
  category: RiskCategory;
  score: number; // 0-100
  level: RiskLevel;
  factors: RiskFactor[];
  summary: string;
  isDemoData: boolean;
  computedAt: string;
}

export function scoreToLevel(score: number): RiskLevel {
  if (score <= 20) return "LOW";
  if (score <= 40) return "MODERATE";
  if (score <= 60) return "ELEVATED";
  if (score <= 80) return "HIGH";
  return "EXTREME";
}

export interface VulnerabilityAdjustment {
  vulnerabilityCategory:
    | "NONE"
    | "RESPIRATORY"
    | "CARDIOVASCULAR"
    | "PREGNANT"
    | "ELDERLY"
    | "CHILD"
    | "OUTDOOR_WORKER";
  ageGroup?: "CHILD" | "YOUTH" | "ADULT" | "SENIOR";
  outdoorWorker?: boolean;
}
