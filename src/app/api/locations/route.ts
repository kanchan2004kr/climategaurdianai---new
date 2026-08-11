import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { locationCreateSchema } from "@/lib/schemas/location";
import { getAvailableLocations } from "@/lib/services/dashboard/locations";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const locations = await getAvailableLocations(session.user.id);
  return NextResponse.json({ locations });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = locationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    // Always scoped to the authenticated user — never accepts a userId from the client.
    const location = await prisma.location.create({
      data: { ...parsed.data, userId: session.user.id },
    });
    return NextResponse.json({ location }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save location. Please try again." }, { status: 503 });
  }
}
