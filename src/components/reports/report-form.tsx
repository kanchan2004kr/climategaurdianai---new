"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

const TYPES: { value: string; label: string }[] = [
  { value: "FLOODING", label: "Flooding" },
  { value: "EXTREME_HEAT", label: "Extreme heat" },
  { value: "SEVERE_POLLUTION", label: "Severe pollution" },
  { value: "WATER_SHORTAGE", label: "Water shortage" },
  { value: "WILDFIRE_SMOKE", label: "Wildfire / smoke" },
  { value: "UNSAFE_WATER", label: "Unsafe water" },
  { value: "INFRASTRUCTURE_DAMAGE", label: "Infrastructure damage" },
  { value: "OTHER", label: "Other" },
];

const SEVERITIES: { value: string; label: string }[] = [
  { value: "INFO", label: "Informational" },
  { value: "WARNING", label: "Warning" },
  { value: "SEVERE", label: "Severe" },
  { value: "EXTREME", label: "Extreme" },
];

export function ReportForm({
  defaultLatitude,
  defaultLongitude,
  locationId,
  locationName,
}: {
  defaultLatitude: number;
  defaultLongitude: number;
  locationId: string;
  locationName: string;
}) {
  const router = useRouter();
  const [type, setType] = useState("OTHER");
  const [severity, setSeverity] = useState("WARNING");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [coords, setCoords] = useState({ latitude: defaultLatitude, longitude: defaultLongitude });
  const [usingMyLocation, setUsingMyLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function useMyLocation() {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setUsingMyLocation(true);
      },
      () => {
        setError("Couldn't access your location — using the saved location instead.");
      }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (description.trim().length < 5) {
      setError("Please describe what you observed (at least 5 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          severity,
          description,
          imageUrl: imageUrl || undefined,
          latitude: coords.latitude,
          longitude: coords.longitude,
          locationId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit report");

      setSuccess(true);
      setDescription("");
      setImageUrl("");
      router.refresh();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="info">Report submitted. It will show as USER REPORT — UNVERIFIED until reviewed.</Alert>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="type">Category</Label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="severity">Severity</Label>
          <select
            id="severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
          >
            {SEVERITIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">What did you observe?</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="Describe what you're seeing — location details, severity, anything relevant"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="imageUrl">Image URL (optional)</Label>
        <Input id="imageUrl" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-surface-muted/50 p-3 text-sm">
        <span className="text-foreground-muted">
          Location: <span className="font-medium text-foreground">{usingMyLocation ? "Your current position" : locationName}</span>
        </span>
        <Button type="button" variant="outline" size="sm" onClick={useMyLocation}>
          <LocateFixed className="size-4" />
          Use my location
        </Button>
      </div>

      <Button type="submit" disabled={submitting} className="self-start">
        {submitting ? "Submitting…" : "Submit report"}
      </Button>
    </form>
  );
}
