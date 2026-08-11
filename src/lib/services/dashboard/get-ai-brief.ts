import { generateAIResponse } from "@/lib/providers/ai";
import { getEnvironmentSnapshot } from "./environment-snapshot";
import { calculateAirRisk, calculateOverallRisk } from "@/lib/services/risk-engine";
import { calculateHeatRisk } from "@/lib/services/heat-risk";
import { calculateWaterRisk } from "@/lib/services/water-risk";
import { calculateDiseaseEnvironmentalRisk } from "@/lib/services/disease-risk";
import { calculateDisasterRisk } from "@/lib/services/disaster-risk";
import { getWaterRiskInputs } from "./environment-snapshot";

export interface AIBrief {
  content: string;
  isFallback: boolean;
  disclaimer?: string;
}

/**
 * Generates the dashboard's AI Climate Brief on its own, off the critical render
 * path. Reuses React.cache'd snapshot/location queries (so no duplicate DB or
 * provider work vs. the main dashboard render) and grounds the model only in
 * already-computed risk-engine values. Streamed via <Suspense>.
 */
export async function getDashboardAIBrief(userId: string, requestedLocationId?: string): Promise<AIBrief> {
  const { location, weather, air, vulnerability } = await getEnvironmentSnapshot(userId, requestedLocationId);

  const airRisk = calculateAirRisk(air, weather, vulnerability);
  const heatRisk = calculateHeatRisk(weather, new Date(), vulnerability);

  const waterInputs = await getWaterRiskInputs(location.id, location.city);
  const waterRisk = calculateWaterRisk(
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
  const disasterMax = disaster.items.reduce((max, item) => (item.score > max.score ? item : max), disaster.items[0]);

  const overall = calculateOverallRisk({
    air: airRisk,
    heat: heatRisk,
    water: waterRisk,
    diseaseScore: Math.max(disease.dengue.score, disease.malaria.score),
    disasterScore: disasterMax.score,
  });

  const aiResponse = await generateAIResponse({
    systemPrompt:
      "You are ClimateGuardian AI's climate-health brief generator. Summarize the user's current environmental risk in 2-3 short sentences, then suggest 2-3 concrete precautions. Only use the numbers provided. Never diagnose disease, never prescribe medication, never claim certainty. This is guidance, not medical advice.",
    userMessage: "Summarize my current climate-health risk and what I should do now.",
    structuredData: {
      overallRisk: { score: overall.score, level: overall.level },
      airRisk: { score: airRisk.score, level: airRisk.level },
      heatRisk: { score: heatRisk.score, level: heatRisk.level },
      waterRisk: { score: waterRisk.score, level: waterRisk.level },
      location: location.name,
    },
  });

  return { content: aiResponse.content, isFallback: aiResponse.isFallback, disclaimer: aiResponse.disclaimer };
}
