import { prisma } from "@/lib/db";
import { sortByDistance, filterWithinRadius, type EmergencyResource } from "@/lib/services/emergency-resources";
import { getEnvironmentSnapshot } from "./environment-snapshot";
import type { LocationOption } from "./locations";

/** Only facilities within this distance of the selected location are shown, so users elsewhere don't see another city's facilities. */
const NEARBY_RADIUS_KM = 50;

export interface EmergencyResourceView extends EmergencyResource {
  distanceKm: number;
  availabilityLabel: string;
}

export interface EmergencyData {
  location: LocationOption;
  availableLocations: LocationOption[];
  resources: EmergencyResourceView[];
  radiusKm: number;
  /** These facilities are static seed data, not a live directory — surfaced honestly in the UI. */
  isSeedData: boolean;
}

export async function getEmergencyData(userId: string, requestedLocationId?: string): Promise<EmergencyData> {
  const { location, availableLocations } = await getEnvironmentSnapshot(userId, requestedLocationId);

  const [hospitals, shelters, waterPoints] = await Promise.all([
    prisma.hospital.findMany(),
    prisma.shelter.findMany(),
    prisma.waterPoint.findMany(),
  ]);

  const resources: EmergencyResource[] = [
    ...hospitals.map((h) => ({
      id: h.id,
      type: "HOSPITAL" as const,
      name: h.name,
      address: h.address,
      city: h.city,
      phone: h.phone,
      latitude: h.latitude,
      longitude: h.longitude,
    })),
    ...shelters.map((s) => ({
      id: s.id,
      type: "SHELTER" as const,
      name: s.name,
      address: s.address,
      city: s.city,
      phone: s.phone,
      latitude: s.latitude,
      longitude: s.longitude,
    })),
    ...waterPoints.map((w) => ({
      id: w.id,
      type: "WATER_POINT" as const,
      name: w.name,
      address: w.address,
      city: w.city,
      latitude: w.latitude,
      longitude: w.longitude,
    })),
  ];

  const availabilityById = new Map<string, string>();
  for (const h of hospitals) availabilityById.set(h.id, h.capacity != null ? `Capacity: ${h.capacity}` : "Availability unknown");
  for (const s of shelters) availabilityById.set(s.id, s.capacity != null ? `Capacity: ${s.capacity} · ${s.isActive ? "Active" : "Inactive"}` : "Availability unknown");
  for (const w of waterPoints) availabilityById.set(w.id, w.status === "UNKNOWN" ? "Availability unknown" : w.status.replace("_", " "));

  // Only show facilities genuinely near the selected location — never another city's.
  const nearby = filterWithinRadius(resources, location, NEARBY_RADIUS_KM);
  const sorted = sortByDistance(nearby, location);

  return {
    location,
    availableLocations,
    radiusKm: NEARBY_RADIUS_KM,
    isSeedData: true,
    resources: sorted.map((r) => ({ ...r, availabilityLabel: availabilityById.get(r.id) ?? "Availability unknown" })),
  };
}
