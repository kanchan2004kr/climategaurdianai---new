import { cache } from "react";
import { prisma } from "@/lib/db";
import { getWeather } from "@/lib/providers/weather";
import { getAirQuality } from "@/lib/providers/air-quality";
import type { VulnerabilityAdjustment } from "@/lib/types/risk";
import type { WeatherData, AirQualityData } from "@/lib/types/environment";
import { getAvailableLocations, resolveLocation, type LocationOption } from "./locations";

export interface EnvironmentSnapshot {
  location: LocationOption;
  availableLocations: LocationOption[];
  weather: WeatherData;
  air: AirQualityData;
  vulnerability?: VulnerabilityAdjustment;
}

/** Resolves location + fetches real weather/air/profile — the common prefix shared by the dashboard and every risk-detail page. */
export const getEnvironmentSnapshot = cache(async function getEnvironmentSnapshot(userId: string, requestedLocationId?: string): Promise<EnvironmentSnapshot> {
  const [location, availableLocations] = await Promise.all([
    resolveLocation(userId, requestedLocationId),
    getAvailableLocations(userId),
  ]);

  if (!location) {
    throw new Error("NO_LOCATION_AVAILABLE");
  }

  const [weather, air, profile] = await Promise.all([
    getWeather(location),
    getAirQuality(location),
    prisma.profile.findUnique({ where: { userId } }),
  ]);

  const vulnerability: VulnerabilityAdjustment | undefined = profile
    ? {
        vulnerabilityCategory: profile.vulnerabilityCategory,
        ageGroup: profile.ageGroup ?? undefined,
        outdoorWorker: profile.outdoorWorker,
      }
    : undefined;

  return { location, availableLocations, weather, air, vulnerability };
});

/** Real DB-backed inputs for the water-risk engine — shared by the dashboard and /risks/water. Cached so the dashboard and its streamed AI brief don't each re-run these 4 queries in one request. */
export const getWaterRiskInputs = cache(async function getWaterRiskInputs(locationId: string, city: string | undefined) {
  const [contamination, noWater, flooding, waterPoints] = await Promise.all([
    prisma.citizenReport.count({
      where: { locationId, type: "UNSAFE_WATER", status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    }),
    prisma.citizenReport.count({
      where: { locationId, type: "WATER_SHORTAGE", status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    }),
    prisma.citizenReport.count({
      where: { locationId, type: "FLOODING", status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    }),
    city ? prisma.waterPoint.findMany({ where: { city } }) : Promise.resolve([]),
  ]);

  const operationalWaterPointRatio =
    waterPoints.length > 0 ? waterPoints.filter((w) => w.status === "OPERATIONAL").length / waterPoints.length : null;

  return {
    activeContaminationReports: contamination,
    activeNoWaterReports: noWater,
    activeFloodingReports: flooding,
    operationalWaterPointRatio,
  };
});

export interface TrendPoint {
  computedAt: string;
  score: number;
}

/** Real stored RiskScore history for a location + category, oldest first. */
export async function getRiskTrend(locationId: string, category: string, limit = 30): Promise<TrendPoint[]> {
  const rows = await prisma.riskScore.findMany({
    where: { locationId, category: category as never },
    orderBy: { computedAt: "asc" },
    take: limit,
  });
  return rows.map((r) => ({ computedAt: r.computedAt.toISOString(), score: r.score }));
}
