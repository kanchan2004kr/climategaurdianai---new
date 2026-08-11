import type { CarbonCategoryEnum } from "@/lib/schemas/carbon";

export type CarbonCategory = CarbonCategoryEnum;

/**
 * Emission factors in kg CO2e per unit. Approximate published averages
 * (IPCC / DEFRA style figures), intended for indicative estimates only.
 */
const EMISSION_FACTORS: Record<CarbonCategory, Record<string, number>> = {
  TRANSPORT: {
    km_car: 0.192,
    km_bus: 0.089,
    km_train: 0.041,
    km_bike: 0,
    km_walk: 0,
    km_motorbike: 0.103,
  },
  FUEL: {
    liter_petrol: 2.31,
    liter_diesel: 2.68,
    liter_cng: 1.85,
  },
  ELECTRICITY: {
    kwh: 0.716, // grid-average factor, adjust per region
  },
  FLIGHTS: {
    km_domestic: 0.246,
    km_international: 0.15,
  },
  FOOD: {
    meal_meat: 3.3,
    meal_vegetarian: 1.1,
    meal_vegan: 0.7,
    kg_beef: 27,
    kg_chicken: 6.9,
    kg_vegetables: 0.4,
  },
  SHOPPING: {
    item_clothing: 10,
    item_electronics: 45,
    inr_general: 0.0005, // rough spend-based proxy factor
  },
};

export function calculateCo2e(category: CarbonCategory, unit: string, quantity: number): number {
  const factor = EMISSION_FACTORS[category]?.[unit];
  if (factor == null) {
    throw new Error(`Unknown unit "${unit}" for category "${category}"`);
  }
  return Math.round(quantity * factor * 100) / 100;
}

export function availableUnitsForCategory(category: CarbonCategory): string[] {
  return Object.keys(EMISSION_FACTORS[category] ?? {});
}

export interface CarbonBreakdownEntry {
  category: CarbonCategory;
  totalCo2eKg: number;
}

export interface CarbonSummary {
  totalCo2eKg: number;
  breakdown: CarbonBreakdownEntry[];
  greenScore: number; // 0-100, higher is better (lower emissions relative to target)
}

/** Global-average sustainable daily target, used only to compute a relative green score. */
const DAILY_TARGET_CO2E_KG = 6;

export function summarizeCarbonRecords(
  records: Array<{ category: CarbonCategory; co2eKg: number }>,
  periodDays: number
): CarbonSummary {
  const byCategory = new Map<CarbonCategory, number>();
  let totalCo2eKg = 0;

  for (const record of records) {
    totalCo2eKg += record.co2eKg;
    byCategory.set(record.category, (byCategory.get(record.category) ?? 0) + record.co2eKg);
  }

  const breakdown: CarbonBreakdownEntry[] = Array.from(byCategory.entries()).map(
    ([category, totalCo2eKgForCategory]) => ({
      category,
      totalCo2eKg: Math.round(totalCo2eKgForCategory * 100) / 100,
    })
  );

  const target = DAILY_TARGET_CO2E_KG * Math.max(1, periodDays);
  const ratio = target > 0 ? totalCo2eKg / target : 0;
  const greenScore = Math.round(Math.max(0, Math.min(100, 100 - ratio * 100)));

  return {
    totalCo2eKg: Math.round(totalCo2eKg * 100) / 100,
    breakdown,
    greenScore,
  };
}
