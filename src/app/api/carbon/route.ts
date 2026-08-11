import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { carbonRecordCreateSchema } from "@/lib/schemas/carbon";
import { calculateCo2e } from "@/lib/services/carbon";
import { getCarbonData } from "@/lib/services/carbon/get-carbon-summary";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getCarbonData(session.user.id);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = carbonRecordCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { category, unit, quantity, description } = parsed.data;

  let co2eKg: number;
  try {
    co2eKg = calculateCo2e(category, unit, quantity);
  } catch {
    return NextResponse.json({ error: `Unit "${unit}" is not supported for category "${category}".` }, { status: 400 });
  }

  try {
    const record = await prisma.carbonRecord.create({
      data: { userId: session.user.id, category, unit, quantity, description, co2eKg },
    });
    return NextResponse.json({ record }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save entry. Please try again." }, { status: 503 });
  }
}
