"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { LocationRiskPoint } from "@/lib/services/dashboard/get-risk-map-data";
import type { MapProviderConfig } from "@/lib/providers/maps";
import type { EmergencyResource } from "@/lib/services/emergency-resources";
import { Alert } from "@/components/ui/alert";

const LEVEL_COLOR: Record<string, string> = {
  LOW: "#22c55e",
  MODERATE: "#eab308",
  ELEVATED: "#f97316",
  HIGH: "#ef4444",
  EXTREME: "#991b1b",
};

const RESOURCE_COLOR: Record<EmergencyResource["type"], string> = {
  HOSPITAL: "#3b82f6",
  SHELTER: "#8b5cf6",
  WATER_POINT: "#06b6d4",
  RELIEF_CENTER: "#8b5cf6",
};

const RESOURCE_LABEL: Record<EmergencyResource["type"], string> = {
  HOSPITAL: "Hospital",
  SHELTER: "Shelter",
  WATER_POINT: "Water point",
  RELIEF_CENTER: "Relief center",
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

interface RiskMapViewProps {
  mapConfig: MapProviderConfig;
  center: { latitude: number; longitude: number; name: string };
  locations: LocationRiskPoint[];
  emergencyResources: EmergencyResource[];
}

export function RiskMapView({ mapConfig, center, locations, emergencyResources }: RiskMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    import("leaflet")
      .then((L) => {
        if (cancelled || !containerRef.current) return;

        const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView(
          [center.latitude, center.longitude],
          9
        );
        mapRef.current = map;

        const isDark =
          typeof document !== "undefined" && document.documentElement.classList.contains("dark");
        L.tileLayer(isDark && mapConfig.tileUrlDark ? mapConfig.tileUrlDark : mapConfig.tileUrl, {
          attribution: mapConfig.attribution,
          maxZoom: mapConfig.maxZoom,
        }).addTo(map);

        // Real risk markers per location, coloured by computed level.
        for (const loc of locations) {
          const color = loc.overallLevel ? LEVEL_COLOR[loc.overallLevel] ?? "#6b7280" : "#6b7280";
          const label =
            loc.overallScore !== null
              ? `${loc.overallLevel} · ${Math.round(loc.overallScore)}/100`
              : "No risk score computed yet";
          const updated = loc.computedAt ? `<br/><span style="opacity:.7">Updated ${new Date(loc.computedAt).toLocaleString()}</span>` : "";
          L.circleMarker([loc.latitude, loc.longitude], {
            radius: 10,
            color: "#ffffff",
            weight: 2,
            fillColor: color,
            fillOpacity: 0.9,
          })
            .addTo(map)
            .bindPopup(`<strong>${escapeHtml(loc.name)}</strong><br/>${escapeHtml(label)}${updated}`);
        }

        // Real emergency-resource markers (seed facility data — labelled as such in the UI).
        for (const r of emergencyResources) {
          L.circleMarker([r.latitude, r.longitude], {
            radius: 5,
            color: RESOURCE_COLOR[r.type],
            weight: 2,
            fillColor: RESOURCE_COLOR[r.type],
            fillOpacity: 0.7,
          })
            .addTo(map)
            .bindPopup(`<strong>${escapeHtml(r.name)}</strong><br/>${RESOURCE_LABEL[r.type]}`);
        }

        setLoaded(true);
        // Leaflet needs a size recalculation once its container is laid out.
        setTimeout(() => map.invalidateSize(), 0);
      })
      .catch(() => {
        if (!cancelled) setError("The map failed to load. The location data below is still available.");
      });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [mapConfig, center.latitude, center.longitude, locations, emergencyResources]);

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-xl border border-border">
      {!loaded && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-surface-muted" aria-busy="true">
          <span className="text-sm text-foreground-muted">Loading map…</span>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
