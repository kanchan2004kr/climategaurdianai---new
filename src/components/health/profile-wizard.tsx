"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Check, ChevronRight, ChevronLeft, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Reveal } from "@/components/motion/reveal";
import type { ProfileRecord } from "@/lib/services/dashboard/get-health-profile-data";
import type { LocationOption } from "@/lib/services/dashboard/locations";

const AGE_GROUPS = ["CHILD", "YOUTH", "ADULT", "SENIOR"] as const;
const VULNERABILITY_CATEGORIES = [
  "NONE",
  "RESPIRATORY",
  "CARDIOVASCULAR",
  "PREGNANT",
  "ELDERLY",
  "CHILD",
  "OUTDOOR_WORKER",
] as const;

const VULNERABILITY_LABEL: Record<string, string> = {
  NONE: "None",
  RESPIRATORY: "Respiratory condition",
  CARDIOVASCULAR: "Cardiovascular condition",
  PREGNANT: "Pregnant",
  ELDERLY: "Elderly",
  CHILD: "Child",
  OUTDOOR_WORKER: "Outdoor worker",
};

const STEPS = ["Location", "Vulnerability", "Activity", "Notifications", "Review"];

interface FormState {
  ageGroup: string;
  vulnerabilityCategory: string;
  outdoorWorker: boolean;
  notifyEmail: boolean;
  notifyPush: boolean;
  notifyAqi: boolean;
  notifyHeat: boolean;
  notifyRain: boolean;
  notifyFlood: boolean;
  notifyWater: boolean;
}

function toFormState(profile: ProfileRecord | null): FormState {
  return {
    ageGroup: profile?.ageGroup ?? "",
    vulnerabilityCategory: profile?.vulnerabilityCategory ?? "NONE",
    outdoorWorker: profile?.outdoorWorker ?? false,
    notifyEmail: profile?.notifyEmail ?? true,
    notifyPush: profile?.notifyPush ?? false,
    notifyAqi: profile?.notifyAqi ?? true,
    notifyHeat: profile?.notifyHeat ?? true,
    notifyRain: profile?.notifyRain ?? true,
    notifyFlood: profile?.notifyFlood ?? true,
    notifyWater: profile?.notifyWater ?? true,
  };
}

export function ProfileWizard({
  profile,
  locations,
  currentLocationId,
}: {
  profile: ProfileRecord | null;
  locations: LocationOption[];
  currentLocationId: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => toFormState(profile));
  const [selectedLocationId, setSelectedLocationId] = useState(currentLocationId);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locatingInProgress, setLocatingInProgress] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function useMyLocation() {
    setLocationError(null);
    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation isn't available in this browser.");
      return;
    }
    setLocatingInProgress(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch("/api/locations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: "My current location",
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Failed to save location");
          setSelectedLocationId(data.location.id);
        } catch (err) {
          setLocationError(err instanceof Error ? err.message : "Failed to save your location.");
        } finally {
          setLocatingInProgress(false);
        }
      },
      () => {
        setLocationError("Location permission was denied or unavailable.");
        setLocatingInProgress(false);
      }
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ageGroup: form.ageGroup || undefined,
          vulnerabilityCategory: form.vulnerabilityCategory,
          outdoorWorker: form.outdoorWorker,
          notifyEmail: form.notifyEmail,
          notifyPush: form.notifyPush,
          notifyAqi: form.notifyAqi,
          notifyHeat: form.notifyHeat,
          notifyRain: form.notifyRain,
          notifyFlood: form.notifyFlood,
          notifyWater: form.notifyWater,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save profile");
      setSaved(true);

      const params = new URLSearchParams();
      params.set("location", selectedLocationId);
      router.push(`/health?${params.toString()}`);
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <Reveal>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-brand-soft">
            <Check className="size-6 text-brand" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Your Climate Profile is Ready</h2>
          <p className="max-w-sm text-sm text-foreground-muted">
            Your personalized risk and action plan below now reflect your profile.
          </p>
          <Button variant="outline" size="sm" onClick={() => setSaved(false)}>
            Edit profile
          </Button>
        </div>
      </Reveal>
    );
  }

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-6">
      <ol className="flex items-center gap-2" aria-label="Profile setup progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 flex-col items-center gap-1">
            <div
              aria-current={i === step ? "step" : undefined}
              className={`flex size-7 items-center justify-center rounded-full text-xs font-medium transition-colors duration-150 ${
                i < step
                  ? "bg-brand text-brand-foreground"
                  : i === step
                    ? "border-2 border-brand text-brand"
                    : "border border-border text-foreground-muted"
              }`}
            >
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </div>
            <span className="hidden text-[11px] text-foreground-muted sm:block">{label}</span>
          </li>
        ))}
      </ol>

      <Reveal key={step} speed="fast">
        {step === 0 && (
          <div className="flex flex-col gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Where should we track climate risk?</h2>
              <p className="mt-1 text-sm text-foreground-muted">
                Pick a saved location, or use your current position.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              {locations.map((loc) => (
                <label
                  key={loc.id}
                  className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft"
                >
                  <input
                    type="radio"
                    name="location"
                    value={loc.id}
                    checked={selectedLocationId === loc.id}
                    onChange={() => setSelectedLocationId(loc.id)}
                    className="accent-brand"
                  />
                  <MapPin className="size-4 text-foreground-muted" />
                  {loc.name}
                  {loc.region ? `, ${loc.region}` : ""}
                </label>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={useMyLocation} disabled={locatingInProgress}>
              <LocateFixed className="size-4" />
              {locatingInProgress ? "Locating…" : "Use my current location"}
            </Button>
            {locationError && <Alert variant="error">{locationError}</Alert>}
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Climate vulnerability</h2>
              <p className="mt-1 text-sm text-foreground-muted">
                This helps personalize your air and heat risk — not medical information, just what our risk
                model already supports.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ageGroup">Age group (optional)</Label>
              <select
                id="ageGroup"
                value={form.ageGroup}
                onChange={(e) => update("ageGroup", e.target.value)}
                className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
              >
                <option value="">Prefer not to say</option>
                {AGE_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vulnerabilityCategory">Vulnerability category</Label>
              <select
                id="vulnerabilityCategory"
                value={form.vulnerabilityCategory}
                onChange={(e) => update("vulnerabilityCategory", e.target.value)}
                className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground"
              >
                {VULNERABILITY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {VULNERABILITY_LABEL[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Activity</h2>
              <p className="mt-1 text-sm text-foreground-muted">
                Outdoor workers get slightly higher weight on air and heat risk.
              </p>
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm">
              <input
                type="checkbox"
                checked={form.outdoorWorker}
                onChange={(e) => update("outdoorWorker", e.target.checked)}
                className="accent-brand"
              />
              I regularly work outdoors
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Notification preferences</h2>
              <p className="mt-1 text-sm text-foreground-muted">Choose which alerts you want to receive.</p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(
                [
                  ["notifyEmail", "Email notifications"],
                  ["notifyPush", "Push notifications"],
                  ["notifyAqi", "High air quality alerts"],
                  ["notifyHeat", "High heat alerts"],
                  ["notifyRain", "Heavy rain alerts"],
                  ["notifyFlood", "Flood risk alerts"],
                  ["notifyWater", "Water advisory alerts"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => update(key, e.target.checked)}
                    className="accent-brand"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Review</h2>
              <p className="mt-1 text-sm text-foreground-muted">Confirm before saving to your account.</p>
            </div>
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <ReviewRow label="Location" value={locations.find((l) => l.id === selectedLocationId)?.name ?? "—"} />
              <ReviewRow label="Age group" value={form.ageGroup || "Not specified"} />
              <ReviewRow label="Vulnerability" value={VULNERABILITY_LABEL[form.vulnerabilityCategory]} />
              <ReviewRow label="Outdoor worker" value={form.outdoorWorker ? "Yes" : "No"} />
            </dl>
            {saveError && <Alert variant="error">{saveError}</Alert>}
          </div>
        )}
      </Reveal>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button variant="ghost" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          <ChevronLeft className="size-4" />
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button size="sm" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
            Next
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </Button>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-muted/50 p-3">
      <dt className="text-xs text-foreground-muted">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}
