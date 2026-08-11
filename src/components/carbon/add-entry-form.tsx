"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { availableUnitsForCategory, type CarbonCategory } from "@/lib/services/carbon";

const CATEGORIES: { value: CarbonCategory; label: string }[] = [
  { value: "TRANSPORT", label: "Transport" },
  { value: "FUEL", label: "Fuel" },
  { value: "ELECTRICITY", label: "Electricity" },
  { value: "FLIGHTS", label: "Flights" },
  { value: "FOOD", label: "Food" },
  { value: "SHOPPING", label: "Shopping" },
];

export function AddEntryForm() {
  const router = useRouter();
  const [category, setCategory] = useState<CarbonCategory>("TRANSPORT");
  const units = useMemo(() => availableUnitsForCategory(category), [category]);
  const [unit, setUnit] = useState(units[0]);
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleCategoryChange(next: CarbonCategory) {
    setCategory(next);
    setUnit(availableUnitsForCategory(next)[0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedQuantity = Number(quantity);
    if (!quantity || Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setError("Enter a quantity greater than 0.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/carbon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, unit, quantity: parsedQuantity, description: description || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save entry");

      setQuantity("");
      setDescription("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save entry.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add an entry</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
          {error && <Alert variant="error">{error}</Alert>}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as CarbonCategory)}
                className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="unit">Unit</Label>
              <select
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 25"
              aria-invalid={Boolean(error)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Commute to work"
              maxLength={200}
            />
          </div>

          <Button type="submit" disabled={submitting} className="self-start">
            {submitting ? "Saving…" : "Add entry"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
