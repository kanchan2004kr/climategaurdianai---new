"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Check, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const noopSubscribe = () => () => {};
function getPermissionSnapshot(): NotificationPermission | "unsupported" {
  return "Notification" in window ? Notification.permission : "unsupported";
}
import { selectLocationAction } from "@/lib/location/actions";
import { updateNameAction } from "@/lib/profile/actions";
import { PushNotificationManager } from "./push-notification-manager";
import type { LocationOption } from "@/lib/services/dashboard/locations";

type NotifyKey = "notifyEmail" | "notifyAqi" | "notifyHeat" | "notifyRain" | "notifyFlood" | "notifyWater";

const NOTIFY_FIELDS: { key: NotifyKey; label: string }[] = [
  { key: "notifyEmail", label: "Email notifications" },
  { key: "notifyAqi", label: "Air quality alerts" },
  { key: "notifyHeat", label: "Heat alerts" },
  { key: "notifyRain", label: "Heavy rain alerts" },
  { key: "notifyFlood", label: "Flood alerts" },
  { key: "notifyWater", label: "Water alerts" },
];

export interface ProfileSettingsProps {
  name: string | null;
  email: string | null;
  role: string;
  locations: LocationOption[];
  selectedLocationId: string;
  preferences: Record<NotifyKey, boolean>;
  canEditProfile: boolean;
}

export function ProfileSettings({
  name,
  email,
  role,
  locations,
  selectedLocationId,
  preferences,
  canEditProfile,
}: ProfileSettingsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [nameValue, setNameValue] = useState(name ?? "");
  const [nameStatus, setNameStatus] = useState<string | null>(null);

  const [prefs, setPrefs] = useState(preferences);
  const [prefStatus, setPrefStatus] = useState<string | null>(null);

  const permission = useSyncExternalStore(noopSubscribe, getPermissionSnapshot, () => "default" as const);

  function saveName() {
    setNameStatus(null);
    startTransition(async () => {
      const res = await updateNameAction(nameValue);
      if (res.ok) {
        setNameStatus("Saved");
        router.refresh();
      } else {
        setNameStatus(res.error ?? "Could not save name.");
      }
    });
  }

  function changeLocation(id: string) {
    startTransition(async () => {
      await selectLocationAction(id);
      router.refresh();
    });
  }

  function togglePref(key: NotifyKey, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setPrefStatus(null);
    startTransition(async () => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      setPrefStatus(res.ok ? "Preferences saved" : "Could not save preferences.");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your ClimateGuardian account details.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="name"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                disabled={!canEditProfile || isPending}
                className="max-w-xs"
              />
              {canEditProfile && (
                <Button size="sm" variant="outline" onClick={saveName} disabled={isPending || nameValue.trim() === (name ?? "")}>
                  Save
                </Button>
              )}
            </div>
            {!canEditProfile && (
              <p className="text-xs text-foreground-muted">Name editing isn&apos;t available for this account.</p>
            )}
            {nameStatus && <p className="text-xs text-foreground-muted">{nameStatus}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label>Email</Label>
            <p className="text-sm text-foreground">{email ?? "—"}</p>
          </div>

          <div className="flex flex-col gap-1">
            <Label>Role</Label>
            <div>
              <Badge variant="neutral">{role}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Locations */}
      <Card>
        <CardHeader>
          <CardTitle>Locations</CardTitle>
          <CardDescription>Your default location is used across the whole app until you change it.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {locations.map((loc) => {
            const isSelected = loc.id === selectedLocationId;
            return (
              <div
                key={loc.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
              >
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="size-4 text-brand" aria-hidden="true" />
                  <span className="text-foreground">
                    {loc.name}
                    {loc.region ? `, ${loc.region}` : ""}
                  </span>
                  {loc.isSaved ? <Badge variant="neutral">Saved</Badge> : <Badge variant="neutral">Demo city</Badge>}
                </div>
                {isSelected ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-brand">
                    <Check className="size-3.5" /> Default
                  </span>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => changeLocation(loc.id)} disabled={isPending}>
                    Set default
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Notification preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose which climate alerts you want to receive.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted/40 px-3 py-2 text-sm">
            {permission === "granted" ? (
              <Bell className="size-4 text-risk-low" />
            ) : (
              <BellOff className="size-4 text-foreground-muted" />
            )}
            <span className="text-foreground-muted">
              Browser notification permission:{" "}
              <span className="font-medium text-foreground">
                {permission === "unsupported" ? "Not supported in this browser" : permission}
              </span>
            </span>
          </div>

          <PushNotificationManager />

          <p className="mt-1 text-xs font-medium text-foreground">In-app alert preferences</p>
          {NOTIFY_FIELDS.map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-foreground">{label}</span>
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={(e) => togglePref(key, e.target.checked)}
                disabled={isPending}
                className="size-4 accent-[var(--color-brand)]"
              />
            </label>
          ))}
          {prefStatus && <p className="text-xs text-foreground-muted">{prefStatus}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
