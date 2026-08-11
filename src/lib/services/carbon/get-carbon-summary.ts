import { prisma } from "@/lib/db";
import { summarizeCarbonRecords, type CarbonCategory } from "@/lib/services/carbon";

export interface CarbonRecordView {
  id: string;
  category: CarbonCategory;
  description: string | null;
  quantity: number;
  unit: string;
  co2eKg: number;
  recordedAt: string;
}

export async function getCarbonData(userId: string, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await prisma.carbonRecord.findMany({
    where: { userId, recordedAt: { gte: since } },
    orderBy: { recordedAt: "desc" },
  });

  const records: CarbonRecordView[] = rows.map((r) => ({
    id: r.id,
    category: r.category,
    description: r.description,
    quantity: r.quantity,
    unit: r.unit,
    co2eKg: r.co2eKg,
    recordedAt: r.recordedAt.toISOString(),
  }));

  const summary = summarizeCarbonRecords(rows, days);

  const topCategory = summary.breakdown.reduce<(typeof summary.breakdown)[number] | null>(
    (top, entry) => (!top || entry.totalCo2eKg > top.totalCo2eKg ? entry : top),
    null
  );

  const largestRecord = records.reduce<CarbonRecordView | null>(
    (largest, record) => (!largest || record.co2eKg > largest.co2eKg ? record : largest),
    null
  );

  return { records, summary, topCategory, largestRecord };
}
