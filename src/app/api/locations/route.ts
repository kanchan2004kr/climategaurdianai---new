import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { locationCreateSchema } from "@/lib/schemas/location";
import { getAvailableLocations, SELECTED_LOCATION_COOKIE } from "@/lib/services/dashboard/locations";
import { reverseGeocode } from "@/lib/providers/geocoding/reverse";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const locations = await getAvailableLocations(session.user.id);
  return NextResponse.json({ locations });
}

/** Marker used to identify the single canonical "current location" row per user, so repeated GPS captures update one record instead of creating duplicates. */
const CURRENT_LOCATION_PREFIX = "Current location";
/** Legacy name used by earlier builds; matched here so old duplicates get cleaned up. */
const LEGACY_CURRENT_LOCATION_NAME = "My current location";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json().catch(() => null);
  const parsed = locationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  // "Use my current location" always posts the reserved name. Anything else is a
  // normal saved location and keeps the original create-a-row behaviour.
  const isCurrentLocation =
    parsed.data.name === LEGACY_CURRENT_LOCATION_NAME || parsed.data.name.startsWith(CURRENT_LOCATION_PREFIX);

  try {
    if (!isCurrentLocation) {
      // Always scoped to the authenticated user — never accepts a userId from the client.
      const location = await prisma.location.create({
        data: { ...parsed.data, userId },
      });
      return NextResponse.json({ location }, { status: 201 });
    }

    const geo = await reverseGeocode(parsed.data.latitude, parsed.data.longitude);
    const name = `${CURRENT_LOCATION_PREFIX} · ${geo.label}`;

    // Find every existing current-location row for this user (new + legacy names).
    const existing = await prisma.location.findMany({
      where: {
        userId,
        OR: [{ name: { startsWith: CURRENT_LOCATION_PREFIX } }, { name: LEGACY_CURRENT_LOCATION_NAME }],
      },
      orderBy: { createdAt: "desc" },
    });

    const data = {
      name,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      city: geo.city ?? null,
      region: geo.region ?? null,
      country: geo.country ?? null,
    };

    let location;
    if (existing.length > 0) {
      // Keep the newest as the canonical current-location record, update it in place…
      const [canonical, ...duplicates] = existing;
      location = await prisma.location.update({ where: { id: canonical.id }, data });
      // …and clean up any true duplicate current-location rows this user accumulated.
      if (duplicates.length > 0) {
        await prisma.location.deleteMany({ where: { id: { in: duplicates.map((d) => d.id) } } });
      }
    } else {
      location = await prisma.location.create({ data: { ...data, userId } });
    }

    // Make the freshly-captured location the globally-selected one.
    (await cookies()).set(SELECTED_LOCATION_COOKIE, location.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    return NextResponse.json({ location }, { status: existing.length > 0 ? 200 : 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save location. Please try again." }, { status: 503 });
  }
}
