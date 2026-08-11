import { prisma } from "@/lib/db";
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

  // The AI action plan is streamed separately (see get-health-action-plan.ts) so a
  // slow model call never blocks the personalized risk data below.

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
  };
}
