import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { profileUpdateSchema } from "@/lib/schemas/profile";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    // upsert scoped strictly to the authenticated user's own id — never accepts a userId from the client.
    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: parsed.data,
      create: { userId: session.user.id, ...parsed.data },
    });
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Failed to save profile. Please try again." }, { status: 503 });
  }
}
