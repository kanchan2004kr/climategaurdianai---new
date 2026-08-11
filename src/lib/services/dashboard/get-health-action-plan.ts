import { prisma } from "@/lib/db";
import { generateAIResponse } from "@/lib/providers/ai";
import { calculateAirRisk, calculateOverallRisk } from "@/lib/services/risk-engine";
import { calculateHeatRisk } from "@/lib/services/heat-risk";
import { calculateWaterRisk } from "@/lib/services/water-risk";
import { calculateDiseaseEnvironmentalRisk } from "@/lib/services/disease-risk";
import { calculateDisasterRisk } from "@/lib/services/disaster-risk";
import { getEnvironmentSnapshot, getWaterRiskInputs } from "./environment-snapshot";

export interface HealthActionPlan {
  content: string;
  isFallback: boolean;
  disclaimer?: string;
}

/**
 * Personal action plan, streamed off the critical path. Reuses React.cache'd
 * snapshot/location/profile queries, so it adds no duplicate DB work versus the
 * main health render, and grounds the model only in computed risk values.
 */
export async function getHealthActionPlan(userId: string, requestedLocationId?: string): Promise<HealthActionPlan> {
  const { location, weather, air, vulnerability } = await getEnvironmentSnapshot(userId, requestedLocationId);
  const profile = await prisma.profile.findUnique({ where: { userId } });

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

  const personalizedOverall = calculateOverallRisk({
    air: personalizedAir,
    heat: personalizedHeat,
    water,
    diseaseScore: Math.max(disease.dengue.score, disease.malaria.score),
    disasterScore: Math.max(...disaster.items.map((i) => i.score)),
  });

  const aiResponse = await generateAIResponse({
    systemPrompt:
      "You are ClimateGuardian AI's personal action-plan generator. Using the structured risk data and the user's supported profile factors, write a short, concrete plan: what to do today, the best time window for outdoor activity, and one air-specific note if relevant. Only use the numbers provided. Never diagnose disease, never recommend medication, never claim certainty. State this is general safety guidance, not a medical diagnosis.",
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

  return { content: aiResponse.content, isFallback: aiResponse.isFallback, disclaimer: aiResponse.disclaimer };
}
