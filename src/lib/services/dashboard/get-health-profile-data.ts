import { prisma } from "@/lib/db";
import { generateAIResponse } from "@/lib/providers/ai";
import { calculateAirRisk, calculateOverallRisk } from "@/lib/services/risk-engine";
import { calculateHeatRisk } from "@/lib/services/heat-risk";
import { calculateWaterRisk } from "@/lib/services/water-risk";
import { calculateDiseaseEnvironmentalRisk } from "@/lib/services/disease-risk";
import { calculateDisasterRisk } from "@/lib/services/disaster-risk";
import type { RiskResult } from "@/lib/types/risk";
import { getEnvironmentSnapshot, getWaterRiskInputs } from "./environment-snapshot";
import type { LocationOption } from "./locations";
import type { WeatherData, AirQualityData } from "@/lib/types/environment";
import type { AgeGroup, VulnerabilityCategory } from "@prisma/client";

export interface ProfileRecord {
  ageGroup: AgeGroup | null;
  vulnerabilityCategory: VulnerabilityCategory;
  outdoorWorker: boolean;
  notifyEmail: boolean;
  notifyPush: boolean;
  notifyAqi: boolean;
  notifyHeat: boolean;
  notifyRain: boolean;
  notifyFlood: boolean;
  notifyWater: boolean;
}

export interface HealthProfileData {
  location: LocationOption;
  availableLocations: LocationOption[];
  weather: WeatherData;
  air: AirQualityData;
  profile: ProfileRecord | null;
  baseline: { air: RiskResult; heat: RiskResult; overall: RiskResult };
  personalized: { air: RiskResult; heat: RiskResult; overall: RiskResult };
  /** Air/Heat are the only engines that currently accept a vulnerability adjustment. */
  personalizationSupported: { air: boolean; heat: boolean; water: false; disease: false; disaster: false };
  actionPlan: { content: string; isFallback: boolean; disclaimer?: string };
}

export async function getHealthProfileData(userId: string, requestedLocationId?: string): Promise<HealthProfileData> {
  const { location, availableLocations, weather, air, vulnerability } = await getEnvironmentSnapshot(
    userId,
    requestedLocationId
  );

  const profile = await prisma.profile.findUnique({ where: { userId } });

  const baselineAir = calculateAirRisk(air, weather, undefined);
  const baselineHeat = calculateHeatRisk(weather, new Date(), undefined);
  const personalizedAir = calculateAirRisk(air, weather, vulnerability);
  const personalizedHeat = calculateHeatRisk(weather, new Date(), vulnerability);

  const waterInputs = await getWaterRiskInputs(location.id, location.city);
  const water = calculateWaterRisk(
    { recentRainfallMm: weather.rainfallMm ?? 0, rainfallLookbackDays: 1, ...waterInputs },
    weather.isDemoData
  );

  const disease = calculateDiseaseEnvironmentalRisk(
    { temperature: weather.temperature, humidity: weather.humidity, rainfallMm: weather.rainfallMm ?? 0 },
    weather.isDemoData
  );
  const diseaseMaxScore = Math.max(disease.dengue.score, disease.malaria.score);

  const disaster = calculateDisasterRisk(
    {
      temperature: weather.temperature,
      humidity: weather.humidity,
      windSpeed: weather.windSpeed,
      precipitation: weather.precipitation,
      rainfallMm: weather.rainfallMm ?? 0,
    },
    weather.isDemoData
  );
  const disasterMaxScore = Math.max(...disaster.items.map((i) => i.score));

  const baselineOverall = calculateOverallRisk({
    air: baselineAir,
    heat: baselineHeat,
    water,
    diseaseScore: diseaseMaxScore,
    disasterScore: disasterMaxScore,
  });
  const personalizedOverall = calculateOverallRisk({
    air: personalizedAir,
    heat: personalizedHeat,
    water,
    diseaseScore: diseaseMaxScore,
    disasterScore: disasterMaxScore,
  });

  const actionPlan = await generateAIResponse({
    systemPrompt:
      "You are ClimateGuardian AI's personal action-plan generator. Using the structured risk data and the user's supported profile factors, write a short, concrete plan: what to do today, the best time window for outdoor activity, and one air-specific note if relevant. Never diagnose disease, never recommend medication, never claim certainty. State this is general safety guidance, not a medical diagnosis.",
    userMessage: "Give me my personal climate action plan for today.",
    structuredData: {
      overallRisk: { score: personalizedOverall.score, level: personalizedOverall.level },
      airRisk: { score: personalizedAir.score, level: personalizedAir.level },
      heatRisk: { score: personalizedHeat.score, level: personalizedHeat.level },
      vulnerabilityCategory: profile?.vulnerabilityCategory ?? "NONE",
      outdoorWorker: profile?.outdoorWorker ?? false,
      location: location.name,
    },
  });

  return {
    location,
    availableLocations,
    weather,
    air,
    profile: profile
      ? {
          ageGroup: profile.ageGroup,
          vulnerabilityCategory: profile.vulnerabilityCategory,
          outdoorWorker: profile.outdoorWorker,
          notifyEmail: profile.notifyEmail,
          notifyPush: profile.notifyPush,
          notifyAqi: profile.notifyAqi,
          notifyHeat: profile.notifyHeat,
          notifyRain: profile.notifyRain,
          notifyFlood: profile.notifyFlood,
          notifyWater: profile.notifyWater,
        }
      : null,
    baseline: { air: baselineAir, heat: baselineHeat, overall: baselineOverall },
    personalized: { air: personalizedAir, heat: personalizedHeat, overall: personalizedOverall },
    personalizationSupported: { air: true, heat: true, water: false, disease: false, disaster: false },
    actionPlan,
  };
}
