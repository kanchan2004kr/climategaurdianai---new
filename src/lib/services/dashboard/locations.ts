import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import type { ResolvedLocation } from "@/lib/types/environment";

/** Cookie holding the user's globally-selected location id — the single source of truth that persists across pages and refreshes. Not sensitive (just a location id), so it isn't httpOnly, but it is set server-side. */
export const SELECTED_LOCATION_COOKIE = "cg_selected_location";

export interface LocationOption extends ResolvedLocation {
  id: string;
  isSaved: boolean;
  isPrimary: boolean;
}

/**
 * Locations available to a user on the dashboard: their own saved locations
 * plus the global seeded demo cities (userId: null), so there's always
 * something to pick from even for a brand-new account.
 *
 * Wrapped in React.cache so the several call sites that need it within a single
 * request (layout, page, resolveLocation, environment-snapshot) share one query
 * instead of each firing a duplicate `Location.findMany`.
 */
export const getAvailableLocations = cache(async (userId: string): Promise<LocationOption[]> => {
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
    isPrimary: row.isPrimary,
  }));
});

/**
 * Resolves the active location using a single source-of-truth priority:
 *   1. an explicit ?location= request (deep links / one-off overrides)
 *   2. the user's persisted selected-location cookie (survives navigation + refresh)
 *   3. the user's primary location
 *   4. the first available location
 * This is what stops pages like /health silently reverting to the default.
 */
export async function resolveLocation(userId: string, requestedId?: string): Promise<LocationOption | null> {
  const options = await getAvailableLocations(userId);
  if (options.length === 0) return null;

  if (requestedId) {
    const match = options.find((o) => o.id === requestedId);
    if (match) return match;
  }

  const cookieId = (await cookies()).get(SELECTED_LOCATION_COOKIE)?.value;
  if (cookieId) {
    const match = options.find((o) => o.id === cookieId);
    if (match) return match;
  }

  // options is already ordered isPrimary desc, name asc, so options[0] is the primary (or first) location.
  return options[0];
}
