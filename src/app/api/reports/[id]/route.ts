import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { citizenReportReviewSchema } from "@/lib/schemas/citizen-report";
import { reviewReport } from "@/lib/services/reports";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Report review is a GOVERNMENT/ADMIN-only action — checked server-side, never trusted from the client.
  if (session.user.role !== "GOVERNMENT" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = citizenReportReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await prisma.citizenReport.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  try {
    // Reviewer identity always comes from the server session, never a client-supplied field.
    const report = await reviewReport(id, session.user.id, parsed.data.status);
    return NextResponse.json({ report });
  } catch {
    return NextResponse.json({ error: "Failed to update report. Please try again." }, { status: 503 });
  }
}
