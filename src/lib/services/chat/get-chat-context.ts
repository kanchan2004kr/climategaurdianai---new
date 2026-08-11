import { prisma } from "@/lib/db";
import { getAvailableLocations, resolveLocation } from "@/lib/services/dashboard/locations";

export interface ChatContext {
  locationId: string;
  locationName: string;
  risk: Record<string, { score: number; level: string; computedAt: string } | null>;
  /** Curated, human-readable context handed to the model — only includes values that actually exist, so the AI never invents missing numbers. */
  summary: string;
}

const CATEGORIES = ["OVERALL", "AIR", "HEAT", "WATER", "DISEASE", "DISASTER"] as const;

const CATEGORY_LABEL: Record<(typeof CATEGORIES)[number], string> = {
  OVERALL: "Overall climate score",
  AIR: "Air risk",
  HEAT: "Heat risk",
  WATER: "Water risk",
  DISEASE: "Disease/environment risk",
  DISASTER: "Disaster risk",
};

/**
 * Real, already-computed risk data for the resolved location — never recomputed or
 * invented here. Categories with no stored RiskScore yet are reported as
 * "Data unavailable" so the model is told explicitly what is and isn't known.
 */
export async function getChatContext(userId: string, requestedLocationId?: string): Promise<ChatContext> {
  const location = await resolveLocation(userId, requestedLocationId);
  if (!location) {
    const available = await getAvailableLocations(userId);
    throw new Error(available.length === 0 ? "NO_LOCATION_AVAILABLE" : "LOCATION_NOT_FOUND");
  }

  const latestScores = await prisma.riskScore.findMany({
    where: { locationId: location.id, category: { in: [...CATEGORIES] } },
    orderBy: [{ category: "asc" }, { computedAt: "desc" }],
    distinct: ["category"],
  });

  const byCategory = new Map(latestScores.map((s) => [s.category, s]));
  const risk: ChatContext["risk"] = {};
  const lines: string[] = [`Location: ${location.name}`];

  let mostRecent: Date | null = null;
  for (const category of CATEGORIES) {
    const row = byCategory.get(category);
    if (row) {
      risk[category] = { score: row.score, level: row.level, computedAt: row.computedAt.toISOString() };
      lines.push(`${CATEGORY_LABEL[category]}: ${row.level} (${Math.round(row.score)}/100)`);
      if (!mostRecent || row.computedAt > mostRecent) mostRecent = row.computedAt;
    } else {
      risk[category] = null;
      lines.push(`${CATEGORY_LABEL[category]}: Data unavailable`);
    }
  }

  if (mostRecent) lines.push(`Last computed: ${mostRecent.toISOString()}`);

  return { locationId: location.id, locationName: location.name, risk, summary: lines.join("\n") };
}
