import type { RiskFactor, RiskLevel } from "@/lib/types/risk";
import { scoreToLevel } from "@/lib/types/risk";

export type DisasterType = "FLOOD" | "EXTREME_RAINFALL" | "CYCLONE" | "WILDFIRE" | "LIGHTNING";

/** Distinguishes modelled estimates from official government alerts and citizen reports. */
export type DisasterRiskSource = "OFFICIAL_ALERT" | "MODELLED_RISK" | "USER_REPORT";

export interface DisasterRiskInput {
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  rainfallMm: number;
  isCycloneSeasonRegion?: boolean;
  dryDaysStreak?: number;
}

export interface DisasterRiskItem {
  type: DisasterType;
  score: number;
  level: RiskLevel;
  source: DisasterRiskSource;
  factors: RiskFactor[];
  computedAt: string;
}

export interface DisasterRiskResult {
  items: DisasterRiskItem[];
  disclaimer: string;
  isDemoData: boolean;
}

const DISCLAIMER =
  "These are modelled risk estimates from weather conditions, not official government emergency alerts. Always follow instructions from local disaster-management authorities.";

export function calculateDisasterRisk(input: DisasterRiskInput, isDemoData: boolean): DisasterRiskResult {
  const now = new Date().toISOString();

  const flood = buildItem("FLOOD", now, [
    weighted("Rainfall", input.rainfallMm, 0.6, clampScore(linearScale(input.rainfallMm, 0, 150))),
    weighted("Precipitation rate", input.precipitation, 0.4, clampScore(linearScale(input.precipitation, 0, 30))),
  ]);

  const extremeRainfall = buildItem("EXTREME_RAINFALL", now, [
    weighted("Precipitation rate", input.precipitation, 1, clampScore(linearScale(input.precipitation, 0, 40))),
  ]);

  const cyclone = buildItem("CYCLONE", now, [
    weighted("Wind speed", input.windSpeed, 0.7, clampScore(linearScale(input.windSpeed, 20, 120))),
    weighted(
      "Regional cyclone exposure",
      input.isCycloneSeasonRegion ? 1 : 0,
      0.3,
      input.isCycloneSeasonRegion ? 40 : 0
    ),
  ]);

  const dryDays = input.dryDaysStreak ?? 0;
  const wildfire = buildItem("WILDFIRE", now, [
    weighted("Temperature", input.temperature, 0.35, clampScore(linearScale(input.temperature, 25, 45))),
    weighted("Low humidity", input.humidity, 0.35, clampScore(linearScale(40 - input.humidity, 0, 40))),
    weighted("Dry streak (days)", dryDays, 0.3, clampScore(linearScale(dryDays, 0, 21))),
  ]);

  const lightning = buildItem("LIGHTNING", now, [
    weighted("Humidity", input.humidity, 0.5, clampScore(linearScale(input.humidity, 60, 95))),
    weighted("Precipitation rate", input.precipitation, 0.5, clampScore(linearScale(input.precipitation, 0, 25))),
  ]);

  return {
    items: [flood, extremeRainfall, cyclone, wildfire, lightning],
    disclaimer: DISCLAIMER,
    isDemoData,
  };
}

function buildItem(type: DisasterType, computedAt: string, factors: RiskFactor[]): DisasterRiskItem {
  const weightedSum = factors.reduce((sum, f) => sum + f.contribution, 0);
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const score = clampScore(totalWeight > 0 ? weightedSum / totalWeight : 0);

  return {
    type,
    score: Math.round(score),
    level: scoreToLevel(score),
    source: "MODELLED_RISK",
    factors,
    computedAt,
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
