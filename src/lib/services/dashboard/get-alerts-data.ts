import { prisma } from "@/lib/db";
import { calculateAirRisk } from "@/lib/services/risk-engine";
import { calculateHeatRisk } from "@/lib/services/heat-risk";
import { calculateWaterRisk } from "@/lib/services/water-risk";
import { calculateDiseaseEnvironmentalRisk } from "@/lib/services/disease-risk";
import { calculateDisasterRisk } from "@/lib/services/disaster-risk";
import { generateAlertCandidates, filterByPreferences, type AlertType } from "@/lib/services/notifications";
import { computeAlertPriority } from "@/lib/services/notifications/priority";
import { sendPushToUser } from "@/lib/push/web-push";
import { getEnvironmentSnapshot, getWaterRiskInputs, getUserProfile } from "./environment-snapshot";
import { resolveLocation, type LocationOption } from "./locations";

const DEDUP_WINDOW_MS = 6 * 60 * 60 * 1000; // don't re-create the same alert type for the same location within 6h
const DEFAULT_EXPIRY_MS = 6 * 60 * 60 * 1000;

const RECOMMENDED_ACTION: Record<AlertType, string> = {
  HIGH_AQI: "Reduce prolonged outdoor exposure and consider a mask outdoors if sensitive.",
  HIGH_HEAT: "Stay hydrated, avoid peak-sun hours, and take breaks in shade or cooled spaces.",
  HEAVY_RAIN: "Avoid low-lying areas and monitor local conditions before travelling.",
  FLOOD_RISK: "Avoid flood-prone routes and keep an eye on official guidance.",
  WATER_ALERT: "Check water quality before use if reports exist nearby; consider stored/treated water.",
  DISEASE_RISK: "Reduce standing-water exposure and use protective measures against mosquitoes.",
  WILDFIRE_RISK: "Stay alert to smoke conditions and limit outdoor exposure during dry, hot spells.",
  CYCLONE_RISK: "Follow official guidance closely and prepare an emergency plan.",
};

export interface AlertView {
  id: string;
  type: string;
  severity: string;
  source: string;
  title: string;
  message: string;
  recommendedAction: string;
  createdAt: string;
  expiresAt: string | null;
  priorityScore: number;
}

export interface AlertsData {
  location: LocationOption;
  availableLocations: LocationOption[];
  alerts: AlertView[];
}

export async function getAlertsData(userId: string, requestedLocationId?: string): Promise<AlertsData> {
  const location = await resolveLocation(userId, requestedLocationId);
  if (!location) throw new Error("NO_LOCATION_AVAILABLE");

  const [snapshot, profile, waterInputs] = await Promise.all([
    getEnvironmentSnapshot(userId, requestedLocationId),
    getUserProfile(userId),
    getWaterRiskInputs(location.id, location.city),
  ]);
  const { availableLocations, weather, air, vulnerability } = snapshot;

  const airRisk = calculateAirRisk(air, weather, vulnerability);
  const heatRisk = calculateHeatRisk(weather, new Date(), vulnerability);

  const waterRisk = calculateWaterRisk(
    { recentRainfallMm: weather.rainfallMm ?? 0, rainfallLookbackDays: 1, ...waterInputs },
    weather.isDemoData
  );

  const diseaseRisk = calculateDiseaseEnvironmentalRisk(
    { temperature: weather.temperature, humidity: weather.humidity, rainfallMm: weather.rainfallMm ?? 0 },
    weather.isDemoData
  );
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
  const floodScore = disasterRisk.items.find((i) => i.type === "FLOOD")?.score ?? 0;
  const wildfireScore = disasterRisk.items.find((i) => i.type === "WILDFIRE")?.score ?? 0;
  const cycloneScore = disasterRisk.items.find((i) => i.type === "CYCLONE")?.score ?? 0;

  const candidates = generateAlertCandidates({
    airLevel: airRisk.level,
    heatLevel: heatRisk.level,
    waterLevel: waterRisk.level,
    floodScore,
    wildfireScore,
    cycloneScore,
    diseaseMaxLevel,
  });

  const filtered = profile
    ? filterByPreferences(candidates, {
        notifyAqi: profile.notifyAqi,
        notifyHeat: profile.notifyHeat,
        notifyRain: profile.notifyRain,
        notifyFlood: profile.notifyFlood,
        notifyWater: profile.notifyWater,
      })
    : candidates;

  // Persist only genuinely new alerts. One query fetches every active alert of the
  // candidate types already present in the dedup window, then a single createMany
  // inserts the rest — replacing the previous per-candidate findFirst+create loop.
  if (filtered.length > 0) {
    const existing = await prisma.alert.findMany({
      where: {
        locationId: location.id,
        type: { in: filtered.map((c) => c.type) },
        isActive: true,
        createdAt: { gte: new Date(Date.now() - DEDUP_WINDOW_MS) },
      },
      select: { type: true },
    });
    const existingTypes = new Set(existing.map((e) => e.type));

    const toCreate = filtered.filter((c) => !existingTypes.has(c.type));
    if (toCreate.length > 0) {
      await prisma.alert.createMany({
        data: toCreate.map((candidate) => ({
          userId,
          locationId: location.id,
          type: candidate.type,
          severity: candidate.severity,
          source: "MODELLED_RISK" as const,
          title: candidate.title,
          message: candidate.message,
          isActive: true,
          expiresAt: new Date(Date.now() + DEFAULT_EXPIRY_MS),
        })),
      });

      // Push only for genuinely new, high-priority alerts. Because we only create
      // alerts that don't already exist in the dedup window, this won't re-notify
      // the same alert on every refresh. Fire-and-forget; never blocks the render.
      const highPriority = toCreate.filter((c) => c.severity === "SEVERE" || c.severity === "EXTREME");
      for (const candidate of highPriority) {
        void sendPushToUser(userId, {
          title: candidate.title,
          body: candidate.message,
          url: "/alerts",
          tag: `alert-${candidate.type}`, // same type replaces, never stacks duplicates
        });
      }
    }
  }

  const rows = await prisma.alert.findMany({
    where: { isActive: true, OR: [{ locationId: location.id }, { userId }] },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const alerts: AlertView[] = rows.map((a) => {
    const { score } = computeAlertPriority({
      severity: a.severity,
      createdAt: a.createdAt.toISOString(),
      isSameLocation: a.locationId === location.id,
      vulnerability,
    });
    return {
      id: a.id,
      type: a.type,
      severity: a.severity,
      source: a.source,
      title: a.title,
      message: a.message,
      recommendedAction: RECOMMENDED_ACTION[a.type as AlertType] ?? "Follow general safety guidance for this risk type.",
      createdAt: a.createdAt.toISOString(),
      expiresAt: a.expiresAt?.toISOString() ?? null,
      priorityScore: score,
    };
  });

  alerts.sort((a, b) => b.priorityScore - a.priorityScore);

  return { location, availableLocations, alerts };
}
