import { prisma } from "@/lib/db";
import { getAvailableLocations, resolveLocation } from "@/lib/services/dashboard/locations";

export interface ChatContext {
  locationId: string;
  locationName: string;
  risk: Record<string, { score: number; level: string; computedAt: string } | null>;
}

const CATEGORIES = ["OVERALL", "AIR", "HEAT", "WATER", "DISEASE", "DISASTER"] as const;

/**
 * Real, already-computed risk data for the resolved location — never recomputed or
 * invented here. Categories with no stored RiskScore yet come back null so the AI
 * prompt (and, ultimately, the model) is told explicitly what is and isn't known.
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
  for (const category of CATEGORIES) {
    const row = byCategory.get(category);
    risk[category] = row ? { score: row.score, level: row.level, computedAt: row.computedAt.toISOString() } : null;
  }

  return { locationId: location.id, locationName: location.name, risk };
}
