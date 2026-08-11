import { prisma } from "@/lib/db";
import { generateAIResponse } from "@/lib/providers/ai";
import { getWeatherForecast, type WeatherForecast } from "@/lib/providers/weather/forecast";
import { calculateAirRisk, calculateOverallRisk } from "@/lib/services/risk-engine";
import { calculateHeatRisk } from "@/lib/services/heat-risk";
import { calculateWaterRisk } from "@/lib/services/water-risk";
import { calculateDiseaseEnvironmentalRisk } from "@/lib/services/disease-risk";
import { calculateDisasterRisk } from "@/lib/services/disaster-risk";
import { sortByDistance, type EmergencyResource } from "@/lib/services/emergency-resources";
import type { RiskResult } from "@/lib/types/risk";
import type { WeatherData, AirQualityData } from "@/lib/types/environment";
import { getEnvironmentSnapshot, getWaterRiskInputs, getRiskTrend, type TrendPoint } from "./environment-snapshot";
import type { LocationOption } from "./locations";

export type { TrendPoint };

export interface DashboardData {
  location: LocationOption;
  availableLocations: LocationOption[];
  weather: WeatherData;
  air: AirQualityData;
  overall: RiskResult;
  categories: {
    air: RiskResult;
    heat: RiskResult;
    water: RiskResult;
    disease: { dengueScore: number; malariaScore: number; level: string; disclaimer: string };
    disaster: { maxScore: number; level: string; disclaimer: string; items: Array<{ type: string; score: number; level: string }> };
  };
  aiBrief: { content: string; isFallback: boolean; disclaimer?: string };
  activeAlerts: Array<{
    id: string;
    type: string;
    severity: string;
    source: string;
    title: string;
    message: string;
    createdAt: string;
  }>;
  emergencyPreview: Array<EmergencyResource & { distanceKm: number }>;
  trend: TrendPoint[];
  forecast: WeatherForecast;
  /** Baseline (no vulnerability adjustment) risk, for the Environmental-vs-Personal comparison. Only meaningful if hasVulnerabilityProfile is true. */
  baseline: { air: RiskResult; heat: RiskResult; overall: RiskResult };
  hasVulnerabilityProfile: boolean;
  generatedAt: string;
}

const RISK_SNAPSHOT_MIN_INTERVAL_MS = 5 * 60 * 1000;

export async function getDashboardData(userId: string, requestedLocationId?: string): Promise<DashboardData> {
  const { location, availableLocations, weather, air, vulnerability } = await getEnvironmentSnapshot(
    userId,
    requestedLocationId
  );

  const airRisk = calculateAirRisk(air, weather, vulnerability);
  const heatRisk = calculateHeatRisk(weather, new Date(), vulnerability);
  const baselineAir = calculateAirRisk(air, weather, undefined);
  const baselineHeat = calculateHeatRisk(weather, new Date(), undefined);

  const waterInputs = await getWaterRiskInputs(location.id, location.city);
  const waterRisk = calculateWaterRisk(
    { recentRainfallMm: weather.rainfallMm ?? 0, rainfallLookbackDays: 1, ...waterInputs },
    weather.isDemoData
  );

  const diseaseRisk = calculateDiseaseEnvironmentalRisk(
    { temperature: weather.temperature, humidity: weather.humidity, rainfallMm: weather.rainfallMm ?? 0 },
    weather.isDemoData
  );
  const diseaseMaxScore = Math.max(diseaseRisk.dengue.score, diseaseRisk.malaria.score);
  const diseaseMaxLevel = diseaseRisk.dengue.score >= diseaseRisk.malaria.score ? diseaseRisk.dengue.level : diseaseRisk.malaria.level;

  const disasterRisk = calculateDisasterRisk(
    {
      temperature: weather.temperature,
      humidity: weather.humidity,
      windSpeed: weather.windSpeed,
      precipitation: weather.precipitation,
      rainfallMm: weather.rainfallMm ?? 0,
    },
    weather.isDemoData
  );
  const disasterMax = disasterRisk.items.reduce((max, item) => (item.score > max.score ? item : max), disasterRisk.items[0]);

  const overall = calculateOverallRisk({
    air: airRisk,
    heat: heatRisk,
    water: waterRisk,
    diseaseScore: diseaseMaxScore,
    disasterScore: disasterMax.score,
  });
  const baselineOverall = calculateOverallRisk({
    air: baselineAir,
    heat: baselineHeat,
    water: waterRisk,
    diseaseScore: diseaseMaxScore,
    disasterScore: disasterMax.score,
  });

  const [alerts, hospitals, shelters, waterPointsForPreview, trend, forecast] = await Promise.all([
    prisma.alert.findMany({
      where: { isActive: true, OR: [{ locationId: location.id }, { userId }] },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.hospital.findMany(),
    prisma.shelter.findMany(),
    prisma.waterPoint.findMany(),
    getRiskTrend(location.id, "OVERALL"),
    getWeatherForecast(location),
  ]);

  const emergencyResources: EmergencyResource[] = [
    ...hospitals.map((h) => ({ id: h.id, type: "HOSPITAL" as const, name: h.name, address: h.address, city: h.city, phone: h.phone, latitude: h.latitude, longitude: h.longitude })),
    ...shelters.map((s) => ({ id: s.id, type: "SHELTER" as const, name: s.name, address: s.address, city: s.city, phone: s.phone, latitude: s.latitude, longitude: s.longitude })),
    ...waterPointsForPreview.map((w) => ({ id: w.id, type: "WATER_POINT" as const, name: w.name, address: w.address, city: w.city, latitude: w.latitude, longitude: w.longitude })),
  ];
  const emergencyPreview = sortByDistance(emergencyResources, location).slice(0, 3);

  const aiBrief = await generateAIResponse({
    systemPrompt:
      "You are ClimateGuardian AI's climate-health brief generator. Summarize the user's current environmental risk in 2-3 short sentences, then suggest 2-3 concrete precautions. Never diagnose disease, never prescribe medication, never claim certainty. This is guidance, not medical advice.",
    userMessage: "Summarize my current climate-health risk and what I should do now.",
    structuredData: {
      overallRisk: { score: overall.score, level: overall.level },
      airRisk: { score: airRisk.score, level: airRisk.level },
      heatRisk: { score: heatRisk.score, level: heatRisk.level },
      waterRisk: { score: waterRisk.score, level: waterRisk.level },
      location: location.name,
    },
  });

  await maybeRecordRiskSnapshot(location.id, overall, airRisk, heatRisk, waterRisk, diseaseMaxScore, diseaseMaxLevel, disasterMax);

  return {
    location,
    availableLocations,
    weather,
    air,
    overall,
    categories: {
      air: airRisk,
      heat: heatRisk,
      water: waterRisk,
      disease: {
        dengueScore: diseaseRisk.dengue.score,
        malariaScore: diseaseRisk.malaria.score,
        level: diseaseMaxLevel,
        disclaimer: diseaseRisk.disclaimer,
      },
      disaster: {
        maxScore: disasterMax.score,
        level: disasterMax.level,
        disclaimer: disasterRisk.disclaimer,
        items: disasterRisk.items.map((i) => ({ type: i.type, score: i.score, level: i.level })),
      },
    },
    aiBrief,
    activeAlerts: alerts.map((a) => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      source: a.source,
      title: a.title,
      message: a.message,
      createdAt: a.createdAt.toISOString(),
    })),
    emergencyPreview,
    trend,
    forecast,
    baseline: { air: baselineAir, heat: baselineHeat, overall: baselineOverall },
    hasVulnerabilityProfile: vulnerability !== undefined,
    generatedAt: new Date().toISOString(),
  };
}

/** Throttled write: only logs a new snapshot if the last one for this location is stale, so we build real trend history without flooding the table on every page view. */
async function maybeRecordRiskSnapshot(
  locationId: string,
  overall: RiskResult,
  air: RiskResult,
  heat: RiskResult,
  water: RiskResult,
  diseaseScore: number,
  diseaseLevel: string,
  disaster: { score: number; level: string }
) {
  const last = await prisma.riskScore.findFirst({
    where: { locationId, category: "OVERALL" },
    orderBy: { computedAt: "desc" },
  });

  if (last && Date.now() - last.computedAt.getTime() < RISK_SNAPSHOT_MIN_INTERVAL_MS) {
    return;
  }

  const rows = [
    { category: "OVERALL" as const, score: overall.score, level: overall.level, factors: overall.factors, isDemoData: overall.isDemoData },
    { category: "AIR" as const, score: air.score, level: air.level, factors: air.factors, isDemoData: air.isDemoData },
    { category: "HEAT" as const, score: heat.score, level: heat.level, factors: heat.factors, isDemoData: heat.isDemoData },
    { category: "WATER" as const, score: water.score, level: water.level, factors: water.factors, isDemoData: water.isDemoData },
    { category: "DISEASE" as const, score: diseaseScore, level: diseaseLevel as RiskResult["level"], factors: [], isDemoData: overall.isDemoData },
    { category: "DISASTER" as const, score: disaster.score, level: disaster.level as RiskResult["level"], factors: [], isDemoData: overall.isDemoData },
  ];

  await prisma.riskScore.createMany({
    data: rows.map((r) => ({
      locationId,
      category: r.category,
      score: r.score,
      level: r.level,
      factors: r.factors as object,
      isDemoData: r.isDemoData,
    })),
  });
}
