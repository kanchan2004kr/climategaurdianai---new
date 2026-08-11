import type { WeatherData } from "@/lib/types/environment";
import type { RiskFactor, RiskResult, VulnerabilityAdjustment } from "@/lib/types/risk";
import { scoreToLevel } from "@/lib/types/risk";
import { vulnerabilityBoost } from "@/lib/services/risk-engine/vulnerability";

export interface HeatRiskResult extends RiskResult {
  heatIndexCelsius: number;
  peakHeatPeriod: string;
  saferActivityPeriods: string[];
}

/**
 * Heat Risk Score (0-100) derived from a simplified heat-index model
 * (temperature + humidity), adjusted for wind, UV, time of day and
 * user vulnerability.
 */
export function calculateHeatRisk(
  weather: Pick<WeatherData, "temperature" | "humidity" | "windSpeed" | "uvIndex">,
  now: Date = new Date(),
  vulnerability?: VulnerabilityAdjustment
): HeatRiskResult {
  const heatIndex = computeHeatIndex(weather.temperature, weather.humidity);

  const factors: RiskFactor[] = [];

  const heatIndexScore = clampScore(linearScale(heatIndex, 20, 50));
  factors.push(weighted("Heat Index", heatIndex, 0.55, heatIndexScore));

  const tempScore = clampScore(linearScale(weather.temperature, 20, 45));
  factors.push(weighted("Temperature", weather.temperature, 0.2, tempScore));

  const uv = weather.uvIndex ?? 0;
  const uvScore = clampScore(linearScale(uv, 0, 11));
  factors.push(weighted("UV Index", uv, 0.15, uvScore));

  // Wind provides slight cooling relief; low wind increases risk.
  const windPenalty = clampScore(linearScale(15 - weather.windSpeed, 0, 15));
  factors.push(weighted("Wind (relief)", weather.windSpeed, 0.1, windPenalty));

  const weightedSum = factors.reduce((sum, f) => sum + f.contribution, 0);
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const baseScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  const timeOfDayBoost = timeOfDayAdjustment(now);
  const boost = vulnerabilityBoost(vulnerability);
  const finalScore = clampScore(baseScore + timeOfDayBoost + boost);

  return {
    category: "HEAT",
    score: Math.round(finalScore),
    level: scoreToLevel(finalScore),
    factors,
    summary: buildSummary(finalScore, heatIndex),
    isDemoData: false,
    computedAt: now.toISOString(),
    heatIndexCelsius: Math.round(heatIndex * 10) / 10,
    peakHeatPeriod: "12:00 PM – 4:00 PM",
    saferActivityPeriods: ["Before 8:00 AM", "After 6:00 PM"],
  };
}

/** Rothfusz-style heat index approximation, Celsius in/out. */
function computeHeatIndex(tempC: number, humidity: number): number {
  const tempF = (tempC * 9) / 5 + 32;
  const hi =
    -42.379 +
    2.04901523 * tempF +
    10.14333127 * humidity -
    0.22475541 * tempF * humidity -
    0.00683783 * tempF * tempF -
    0.05481717 * humidity * humidity +
    0.00122874 * tempF * tempF * humidity +
    0.00085282 * tempF * humidity * humidity -
    0.00000199 * tempF * tempF * humidity * humidity;

  // Simplified formula is only meaningful above ~27C / 40% humidity;
  // below that, fall back to raw temperature to avoid nonsense values.
  if (tempC < 27 || humidity < 40) {
    return tempC;
  }

  return ((hi - 32) * 5) / 9;
}

function timeOfDayAdjustment(now: Date): number {
  const hour = now.getHours();
  if (hour >= 12 && hour <= 16) return 8;
  if (hour >= 10 && hour < 12) return 4;
  return 0;
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

function buildSummary(score: number, heatIndex: number): string {
  const level = scoreToLevel(score);
  return `Heat risk is ${level.toLowerCase()} (feels-like ${Math.round(heatIndex)}°C). General heat-safety guidance applies, not a medical assessment.`;
}
