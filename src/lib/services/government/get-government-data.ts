import { prisma } from "@/lib/db";
import { getAllReportsForGovernment } from "@/lib/services/reports";

export interface HotspotView {
  locationId: string;
  locationName: string;
  score: number;
  level: string;
  computedAt: string;
}

export interface GovernmentData {
  reports: Awaited<ReturnType<typeof getAllReportsForGovernment>>;
  activeAlerts: Array<{
    id: string;
    type: string;
    severity: string;
    source: string;
    title: string;
    locationName: string | null;
    createdAt: string;
  }>;
  hotspots: HotspotView[];
  emergencyCounts: { hospitals: number; shelters: number; waterPoints: number; operationalWaterPointRatio: number | null };
  affectedLocationCount: number;
}

export async function getGovernmentData(): Promise<GovernmentData> {
  const [reports, alerts, latestOverallScores, hospitals, shelters, waterPoints] = await Promise.all([
    getAllReportsForGovernment(),
    prisma.alert.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { location: { select: { name: true } } },
    }),
    prisma.riskScore.findMany({
      where: { category: "OVERALL" },
      orderBy: { computedAt: "desc" },
      take: 200,
      include: { location: { select: { name: true } } },
    }),
    prisma.hospital.count(),
    prisma.shelter.count(),
    prisma.waterPoint.findMany({ select: { status: true } }),
  ]);

  // Keep only the most recent OVERALL score per location.
  const seen = new Set<string>();
  const hotspots: HotspotView[] = [];
  for (const row of latestOverallScores) {
    if (seen.has(row.locationId)) continue;
    seen.add(row.locationId);
    hotspots.push({
      locationId: row.locationId,
      locationName: row.location?.name ?? "Unknown",
      score: row.score,
      level: row.level,
      computedAt: row.computedAt.toISOString(),
    });
  }
  hotspots.sort((a, b) => b.score - a.score);

  const operationalWaterPointRatio =
    waterPoints.length > 0 ? waterPoints.filter((w) => w.status === "OPERATIONAL").length / waterPoints.length : null;

  const affectedLocationIds = new Set(alerts.map((a) => a.locationId).filter(Boolean));

  return {
    reports,
    activeAlerts: alerts.map((a) => ({
      id: a.id,
      type: a.type,
      severity: a.severity,
      source: a.source,
      title: a.title,
      locationName: a.location?.name ?? null,
      createdAt: a.createdAt.toISOString(),
    })),
    hotspots: hotspots.slice(0, 10),
    emergencyCounts: {
      hospitals,
      shelters,
      waterPoints: waterPoints.length,
      operationalWaterPointRatio,
    },
    affectedLocationCount: affectedLocationIds.size,
  };
}
