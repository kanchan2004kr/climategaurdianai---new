import type { GeoPoint } from "@/lib/types/environment";

export type EmergencyResourceType = "HOSPITAL" | "SHELTER" | "WATER_POINT" | "RELIEF_CENTER";

export interface EmergencyResource extends GeoPoint {
  id: string;
  type: EmergencyResourceType;
  name: string;
  address: string;
  city: string;
  phone?: string | null;
  distanceKm?: number;
}

/** Haversine distance in kilometers between two geo points. */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function sortByDistance<T extends GeoPoint>(items: T[], from: GeoPoint): Array<T & { distanceKm: number }> {
  return items
    .map((item) => ({ ...item, distanceKm: Math.round(distanceKm(from, item) * 10) / 10 }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function filterByType<T extends { type: EmergencyResourceType }>(
  items: T[],
  types: EmergencyResourceType[]
): T[] {
  if (types.length === 0) return items;
  return items.filter((item) => types.includes(item.type));
}

export function filterWithinRadius<T extends GeoPoint>(
  items: T[],
  from: GeoPoint,
  radiusKm: number
): T[] {
  return items.filter((item) => distanceKm(from, item) <= radiusKm);
}

/** Builds a directions URL for a generic maps provider (no API key required for basic links). */
export function buildDirectionsUrl(destination: GeoPoint): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`;
}
