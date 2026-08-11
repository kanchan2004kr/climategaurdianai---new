"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CarbonBreakdownEntry } from "@/lib/services/carbon";

const CATEGORY_LABEL: Record<string, string> = {
  TRANSPORT: "Transport",
  FUEL: "Fuel",
  ELECTRICITY: "Electricity",
  FLIGHTS: "Flights",
  FOOD: "Food",
  SHOPPING: "Shopping",
};

export function CarbonBreakdown({ breakdown }: { breakdown: CarbonBreakdownEntry[] }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const max = Math.max(...breakdown.map((b) => b.totalCo2eKg), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Breakdown by category</CardTitle>
      </CardHeader>
      <CardContent>
        {breakdown.length === 0 ? (
          <p className="text-sm text-foreground-muted">No entries in the last 30 days yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {breakdown
              .slice()
              .sort((a, b) => b.totalCo2eKg - a.totalCo2eKg)
              .map((entry) => (
                <div key={entry.category}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-foreground">{CATEGORY_LABEL[entry.category] ?? entry.category}</span>
                    <span className="tabular text-foreground-muted">{entry.totalCo2eKg.toFixed(1)} kg</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out"
                      style={{ width: animated ? `${(entry.totalCo2eKg / max) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
