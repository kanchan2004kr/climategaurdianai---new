import { prisma } from "@/lib/db";
import type { ResolvedLocation } from "@/lib/types/environment";

export interface LocationOption extends ResolvedLocation {
  id: string;
  isSaved: boolean;
}

/**
 * Locations available to a user on the dashboard: their own saved locations
 * plus the global seeded demo cities (userId: null), so there's always
 * something to pick from even for a brand-new account.
 */
export async function getAvailableLocations(userId: string): Promise<LocationOption[]> {
  const rows = await prisma.location.findMany({
    where: { OR: [{ userId }, { userId: null }] },
    orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city ?? undefined,
    region: row.region ?? undefined,
    country: row.country ?? undefined,
    latitude: row.latitude,
    longitude: row.longitude,
    isSaved: row.userId === userId,
  }));
}

/** Resolves the active dashboard location: the requested id if valid, else the user's primary, else the first available. */
export async function resolveLocation(userId: string, requestedId?: string): Promise<LocationOption | null> {
  const options = await getAvailableLocations(userId);
  if (options.length === 0) return null;

  if (requestedId) {
    const match = options.find((o) => o.id === requestedId);
    if (match) return match;
  }

  return options[0];
}
