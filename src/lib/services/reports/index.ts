import { prisma } from "@/lib/db";
import type { CitizenReportStatus } from "@prisma/client";
import type { CitizenReportCreateInput } from "@/lib/schemas/citizen-report";

/** Creates a citizen report scoped strictly to the authenticated user — never accepts a client-supplied userId. */
export async function createReport(userId: string, input: CitizenReportCreateInput) {
  return prisma.citizenReport.create({
    data: {
      userId,
      type: input.type,
      severity: input.severity,
      description: input.description,
      imageUrl: input.imageUrl,
      latitude: input.latitude,
      longitude: input.longitude,
      locationId: input.locationId,
    },
  });
}

/** A user's own reports only — never another user's. */
export async function getUserReports(userId: string) {
  return prisma.citizenReport.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/** Government-wide view: all reports, with reporter identity deliberately omitted to protect citizen privacy. */
export async function getAllReportsForGovernment() {
  const reports = await prisma.citizenReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      location: { select: { name: true, city: true, region: true } },
      reviewedBy: { select: { name: true } },
    },
  });

  return reports.map((r) => ({
    id: r.id,
    type: r.type,
    severity: r.severity,
    description: r.description,
    imageUrl: r.imageUrl,
    latitude: r.latitude,
    longitude: r.longitude,
    status: r.status,
    locationName: r.location?.name ?? null,
    reviewedByName: r.reviewedBy?.name ?? null,
    reviewedAt: r.reviewedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  }));
}

/** Government-only mutation: verified server-side by the caller checking session.user.role before invoking this. Reviewer identity is always taken from the server session, never the client. */
export async function reviewReport(reportId: string, reviewerId: string, status: CitizenReportStatus) {
  return prisma.citizenReport.update({
    where: { id: reportId },
    data: { status, reviewedByUserId: reviewerId, reviewedAt: new Date() },
  });
}
