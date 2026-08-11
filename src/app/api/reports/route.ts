import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { citizenReportCreateSchema } from "@/lib/schemas/citizen-report";
import { createReport, getUserReports } from "@/lib/services/reports";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reports = await getUserReports(session.user.id);
  return NextResponse.json({ reports });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = citizenReportCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    // Always scoped to the authenticated user's own id — never accepts a userId from the client.
    const report = await createReport(session.user.id, parsed.data);
    return NextResponse.json({ report }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to submit report. Please try again." }, { status: 503 });
  }
}
