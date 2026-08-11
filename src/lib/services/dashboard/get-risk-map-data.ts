import { prisma } from "@/lib/db";
import { getMapProvider } from "@/lib/providers/maps";
import type { EmergencyResource } from "@/lib/services/emergency-resources";
import { getAvailableLocations, type LocationOption } from "./locations";

export interface LocationRiskPoint extends LocationOption {
  /** Most recently computed overall risk score for this location, or null if none has been recorded yet. */
  overallScore: number | null;
  overallLevel: string | null;
  computedAt: string | null;
}

export interface RiskMapData {
  mapConfig: { name: string; clientToken: string | null; styleUrl?: string };
  locations: LocationRiskPoint[];
  emergencyResources: EmergencyResource[];
}

/**
 * Real data only: locations paired with their latest *stored* RiskScore (never recomputed
 * or invented here), plus real emergency-resource pins. A location with no RiskScore rows
 * yet (e.g. never viewed on the dashboard) is returned with null score/level rather than
 * a fabricated value — the UI must show that as "no data yet".
 */
export async function getRiskMapData(userId: string): Promise<RiskMapData> {
  const [locations, latestOverallScores, hospitals, shelters, waterPoints] = await Promise.all([
    getAvailableLocations(userId),
    prisma.riskScore.findMany({
      where: { category: "OVERALL" },
      orderBy: [{ locationId: "asc" }, { computedAt: "desc" }],
      distinct: ["locationId"],
    }),
    prisma.hospital.findMany(),
    prisma.shelter.findMany(),
    prisma.waterPoint.findMany(),
  ]);

  const scoreByLocation = new Map(latestOverallScores.map((s) => [s.locationId, s]));

  const locationPoints: LocationRiskPoint[] = locations.map((loc) => {
    const score = scoreByLocation.get(loc.id);
    return {
      ...loc,
      overallScore: score?.score ?? null,
      overallLevel: score?.level ?? null,
      computedAt: score?.computedAt.toISOString() ?? null,
    };
  });

  const emergencyResources: EmergencyResource[] = [
    ...hospitals.map((h) => ({ id: h.id, type: "HOSPITAL" as const, name: h.name, address: h.address, city: h.city, phone: h.phone, latitude: h.latitude, longitude: h.longitude })),
    ...shelters.map((s) => ({ id: s.id, type: "SHELTER" as const, name: s.name, address: s.address, city: s.city, phone: s.phone, latitude: s.latitude, longitude: s.longitude })),
    ...waterPoints.map((w) => ({ id: w.id, type: "WATER_POINT" as const, name: w.name, address: w.address, city: w.city, latitude: w.latitude, longitude: w.longitude })),
  ];

  const provider = getMapProvider();

  return {
    mapConfig: provider.getClientConfig(),
    locations: locationPoints,
    emergencyResources,
  };
}
