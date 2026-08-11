import type { RiskFactor, RiskLevel } from "@/lib/types/risk";
import { scoreToLevel } from "@/lib/types/risk";

export interface DiseaseEnvironmentalInput {
  temperature: number; // Celsius, recent average
  humidity: number; // %
  rainfallMm: number; // recent accumulated rainfall
  populationDensity?: number | null; // people per km², optional
}

export interface DiseaseSuitabilityResult {
  disease: "dengue" | "malaria";
  score: number; // 0-100 environmental suitability, NOT a diagnosis
  level: RiskLevel;
  factors: RiskFactor[];
  label: string;
  isDemoData: boolean;
  computedAt: string;
}

export interface DiseaseEnvironmentalRisk {
  dengue: DiseaseSuitabilityResult;
  malaria: DiseaseSuitabilityResult;
  disclaimer: string;
}

const DISCLAIMER =
  "These are environmental/population-level risk indicators derived from climate conditions known to affect vector breeding. They are not disease predictions, case forecasts, or medical diagnoses. Consult local health authorities for confirmed outbreak data.";

/**
 * Environmental suitability indicators for climate-sensitive vector-borne
 * disease risk. Represents conditions favorable to vector breeding, not
 * actual case counts or individual diagnosis.
 */
export function calculateDiseaseEnvironmentalRisk(
  input: DiseaseEnvironmentalInput,
  isDemoData: boolean
): DiseaseEnvironmentalRisk {
  return {
    dengue: calculateDengueSuitability(input, isDemoData),
    malaria: calculateMalariaSuitability(input, isDemoData),
    disclaimer: DISCLAIMER,
  };
}

function calculateDengueSuitability(
  input: DiseaseEnvironmentalInput,
  isDemoData: boolean
): DiseaseSuitabilityResult {
  const factors: RiskFactor[] = [];

  // Aedes mosquitoes favor warm temps (25-32C) and standing water from rainfall.
  const tempScore = bellCurveScore(input.temperature, 28, 6);
  factors.push(weighted("Temperature suitability", input.temperature, 0.35, tempScore));

  const rainScore = clampScore(linearScale(input.rainfallMm, 0, 100));
  factors.push(weighted("Rainfall (breeding sites)", input.rainfallMm, 0.35, rainScore));

  const humidityScore = clampScore(linearScale(input.humidity, 50, 90));
  factors.push(weighted("Humidity", input.humidity, 0.2, humidityScore));

  if (input.populationDensity != null) {
    const densityScore = clampScore(linearScale(input.populationDensity, 0, 15000));
    factors.push(weighted("Population density", input.populationDensity, 0.1, densityScore));
  }

  const score = combineFactors(factors);

  return {
    disease: "dengue",
    score: Math.round(score),
    level: scoreToLevel(score),
    factors,
    label: "Dengue environmental suitability indicator",
    isDemoData,
    computedAt: new Date().toISOString(),
  };
}

function calculateMalariaSuitability(
  input: DiseaseEnvironmentalInput,
  isDemoData: boolean
): DiseaseSuitabilityResult {
  const factors: RiskFactor[] = [];

  // Anopheles mosquitoes favor warm, humid conditions (20-30C) with rainfall.
  const tempScore = bellCurveScore(input.temperature, 25, 7);
  factors.push(weighted("Temperature suitability", input.temperature, 0.35, tempScore));

  const rainScore = clampScore(linearScale(input.rainfallMm, 0, 150));
  factors.push(weighted("Rainfall (breeding sites)", input.rainfallMm, 0.4, rainScore));

  const humidityScore = clampScore(linearScale(input.humidity, 55, 95));
  factors.push(weighted("Humidity", input.humidity, 0.25, humidityScore));

  const score = combineFactors(factors);

  return {
    disease: "malaria",
    score: Math.round(score),
    level: scoreToLevel(score),
    factors,
    label: "Malaria environmental suitability indicator",
    isDemoData,
    computedAt: new Date().toISOString(),
  };
}

function combineFactors(factors: RiskFactor[]): number {
  const weightedSum = factors.reduce((sum, f) => sum + f.contribution, 0);
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  return clampScore(totalWeight > 0 ? weightedSum / totalWeight : 0);
}

function weighted(label: string, value: number, weight: number, factorScore: number): RiskFactor {
  return { label, value, weight, contribution: factorScore * weight };
}

function linearScale(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 100;
}

/** Peaks at `optimum`, decaying with distance — models a suitable temperature band. */
function bellCurveScore(value: number, optimum: number, spread: number): number {
  const distance = Math.abs(value - optimum);
  const score = 100 * Math.exp(-(distance * distance) / (2 * spread * spread));
  return clampScore(score);
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}
