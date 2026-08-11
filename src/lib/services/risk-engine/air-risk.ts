import type { AirQualityData, WeatherData } from "@/lib/types/environment";
import type { RiskFactor, RiskResult, VulnerabilityAdjustment } from "@/lib/types/risk";
import { scoreToLevel } from "@/lib/types/risk";
import { vulnerabilityBoost } from "./vulnerability";

/**
 * Explainable Air Risk Score (0-100), built from weighted sub-factors so
 * every contribution can be shown to the user. Never claims a diagnosis.
 */
export function calculateAirRisk(
  air: AirQualityData,
  weather: Pick<WeatherData, "temperature" | "humidity" | "windSpeed">,
  vulnerability?: VulnerabilityAdjustment
): RiskResult {
  const factors: RiskFactor[] = [];

  const aqiFactor = clampScore(linearScale(air.aqi, 0, 300));
  factors.push(weighted("AQI", air.aqi, 0.4, aqiFactor));

  const pm25Factor = clampScore(linearScale(air.pm25, 0, 150));
  factors.push(weighted("PM2.5", air.pm25, 0.25, pm25Factor));

  if (air.pm10 != null) {
    const pm10Factor = clampScore(linearScale(air.pm10, 0, 250));
    factors.push(weighted("PM10", air.pm10, 0.1, pm10Factor));
  }

  if (air.o3 != null) {
    const o3Factor = clampScore(linearScale(air.o3, 0, 200));
    factors.push(weighted("O3", air.o3, 0.1, o3Factor));
  }

  if (air.no2 != null) {
    const no2Factor = clampScore(linearScale(air.no2, 0, 200));
    factors.push(weighted("NO2", air.no2, 0.05, no2Factor));
  }

  // Low wind traps pollutants; high humidity worsens particulate exposure.
  const windPenalty = clampScore(linearScale(20 - weather.windSpeed, 0, 20));
  factors.push(weighted("Wind (stagnation)", weather.windSpeed, 0.05, windPenalty));

  const humidityPenalty = clampScore(linearScale(weather.humidity - 60, 0, 40));
  factors.push(weighted("Humidity", weather.humidity, 0.05, humidityPenalty));

  const weightedSum = factors.reduce((sum, f) => sum + f.contribution, 0);
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const baseScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  const boost = vulnerabilityBoost(vulnerability);
  const finalScore = clampScore(baseScore + boost);

  return {
    category: "AIR",
    score: Math.round(finalScore),
    level: scoreToLevel(finalScore),
    factors,
    summary: buildSummary(finalScore, air, boost),
    isDemoData: air.isDemoData,
    computedAt: new Date().toISOString(),
  };
}

function weighted(label: string, value: number, weight: number, factorScore: number): RiskFactor {
  return {
    label,
    value,
    weight,
    contribution: factorScore * weight,
  };
}

/** Maps a raw value in [min, max] to a 0-100 risk contribution. */
function linearScale(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 100;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function buildSummary(score: number, air: AirQualityData, boost: number): string {
  const level = scoreToLevel(score);
  const parts = [
    `Air quality risk is ${level.toLowerCase()} (AQI ${Math.round(air.aqi)}, PM2.5 ${Math.round(air.pm25)} µg/m³).`,
  ];
  if (boost > 0) {
    parts.push("Adjusted upward based on your profile's vulnerability factors.");
  }
  return parts.join(" ");
}
