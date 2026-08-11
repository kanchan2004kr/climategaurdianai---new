import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getCarbonData } from "@/lib/services/carbon/get-carbon-summary";
import { recommendationsFor } from "@/lib/services/carbon/recommendations";
import { CarbonOverview } from "@/components/carbon/carbon-overview";
import { CarbonBreakdown } from "@/components/carbon/carbon-breakdown";
import { AddEntryForm } from "@/components/carbon/add-entry-form";
import { WhatIfSimulator } from "@/components/carbon/what-if-simulator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = { title: "Carbon Wallet" };

const CATEGORY_LABEL: Record<string, string> = {
  TRANSPORT: "Transport",
  FUEL: "Fuel",
  ELECTRICITY: "Electricity",
  FLIGHTS: "Flights",
  FOOD: "Food",
  SHOPPING: "Shopping",
};

export default async function CarbonPage() {
  const session = await auth();
  if (!session?.user) return null;

  const { summary, topCategory, largestRecord } = await getCarbonData(session.user.id);

  const recommendations = topCategory ? recommendationsFor(topCategory.category) : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Carbon Wallet</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Track your estimated CO₂e from transport, fuel, electricity, flights, food and shopping.
        </p>
      </div>

      <Reveal>
        <CarbonOverview summary={summary} topCategoryLabel={topCategory ? CATEGORY_LABEL[topCategory.category] : null} />
      </Reveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Reveal>
          <CarbonBreakdown breakdown={summary.breakdown} />
        </Reveal>
        <Reveal direction="left">
          <WhatIfSimulator record={largestRecord} />
        </Reveal>
      </div>

      <Reveal>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Biggest opportunity</CardTitle>
          </CardHeader>
          <CardContent>
            {recommendations.length === 0 ? (
              <p className="text-sm text-foreground-muted">Add an entry to get personalized suggestions.</p>
            ) : (
              <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
                {recommendations.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </Reveal>

      <Reveal>
        <AddEntryForm />
      </Reveal>
    </div>
  );
}
