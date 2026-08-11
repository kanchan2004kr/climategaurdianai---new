import type { CarbonCategory } from "@/lib/services/carbon";

/** Recommendations tied to the user's actual largest emission category — not generic tips. */
export function recommendationsFor(category: CarbonCategory): string[] {
  switch (category) {
    case "TRANSPORT":
      return ["Try public transport or carpooling for part of your commute", "Walk or cycle for shorter trips"];
    case "FUEL":
      return ["Combine errands into fewer trips", "Consider a lower-emission vehicle for your next switch"];
    case "ELECTRICITY":
      return ["Switch off appliances/lights when not in use", "Consider energy-efficient appliances where possible"];
    case "FLIGHTS":
      return ["Combine trips to reduce flight frequency", "Consider train travel for shorter distances where available"];
    case "FOOD":
      return ["Try more plant-based meals during the week", "Reduce food waste by planning portions"];
    case "SHOPPING":
      return ["Buy fewer, longer-lasting items", "Consider second-hand options where practical"];
    default:
      return [];
  }
}
