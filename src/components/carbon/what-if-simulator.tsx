"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/motion/animated-number";
import type { CarbonRecordView } from "@/lib/services/carbon/get-carbon-summary";

const CATEGORY_LABEL: Record<string, string> = {
  TRANSPORT: "transport",
  FUEL: "fuel",
  ELECTRICITY: "electricity",
  FLIGHTS: "flights",
  FOOD: "food",
  SHOPPING: "shopping",
};

export function WhatIfSimulator({ record }: { record: CarbonRecordView | null }) {
  const [reduction, setReduction] = useState(20);

  if (!record) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">What if I change this?</CardTitle>
          <CardDescription>Add an entry above to try a reduction scenario.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const estimatedSaved = (record.co2eKg * reduction) / 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">What if I change this?</CardTitle>
        <CardDescription>
          Your biggest single entry: {record.quantity} {record.unit.replace(/_/g, " ")} of{" "}
          {CATEGORY_LABEL[record.category] ?? record.category} ({record.co2eKg.toFixed(1)} kg CO₂e)
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="flex items-center justify-between text-foreground-muted">
            Reduce by
            <span className="tabular font-medium text-foreground">{reduction}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={50}
            step={5}
            value={reduction}
            onChange={(e) => setReduction(Number(e.target.value))}
            className="accent-brand"
            aria-label="Reduction percentage"
          />
        </label>
        <div className="rounded-lg border border-border bg-brand-soft p-3">
          <p className="text-xs text-foreground-muted">Estimated CO₂e reduction</p>
          <AnimatedNumber value={estimatedSaved} decimals={1} suffix=" kg" className="tabular text-xl font-semibold text-brand" />
          <p className="mt-1 text-xs text-foreground-muted">
            Estimate only, scaled from this entry&apos;s emission factor — not a precise real-world measurement.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
