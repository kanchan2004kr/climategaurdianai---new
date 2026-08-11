"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { getAvailableLocations, SELECTED_LOCATION_COOKIE } from "@/lib/services/dashboard/locations";

/**
 * Persists the user's selected location in a cookie so every page (Dashboard,
 * Health, Alerts, Risk Map, Emergency, ClimateGPT, Profile) resolves to the same
 * place across navigation and refresh. Validates the id belongs to a location the
 * user can actually see before trusting it.
 */
export async function selectLocationAction(locationId: string): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user) return { ok: false };

  const options = await getAvailableLocations(session.user.id);
  if (!options.some((o) => o.id === locationId)) return { ok: false };

  (await cookies()).set(SELECTED_LOCATION_COOKIE, locationId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return { ok: true };
}
