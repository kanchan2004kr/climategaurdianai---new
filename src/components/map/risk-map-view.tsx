"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";
import type { LocationRiskPoint } from "@/lib/services/dashboard/get-risk-map-data";
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

interface RiskMapViewProps {
  mapConfig: { clientToken: string | null; styleUrl?: string };
  locations: LocationRiskPoint[];
  emergencyResources: EmergencyResource[];
}

export function RiskMapView({ mapConfig, locations, emergencyResources }: RiskMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("mapbox-gl").Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mapConfig.clientToken || !containerRef.current) return;

    let cancelled = false;

    import("mapbox-gl")
      .then((mapboxgl) => {
        if (cancelled || !containerRef.current) return;
        mapboxgl.default.accessToken = mapConfig.clientToken as string;

        const first = locations[0];
        const map = new mapboxgl.default.Map({
          container: containerRef.current,
          style: mapConfig.styleUrl ?? "mapbox://styles/mapbox/light-v11",
          center: first ? [first.longitude, first.latitude] : [0, 20],
          zoom: first ? 9 : 1.5,
        });
        mapRef.current = map;

        map.addControl(new mapboxgl.default.NavigationControl(), "top-right");

        map.on("load", () => setLoaded(true));

        for (const loc of locations) {
          const color = loc.overallLevel ? LEVEL_COLOR[loc.overallLevel] ?? "#6b7280" : "#6b7280";
          const label = loc.overallScore !== null ? `${loc.overallLevel} (${Math.round(loc.overallScore)})` : "No risk data yet";

          const el = document.createElement("div");
          el.style.width = "18px";
          el.style.height = "18px";
          el.style.borderRadius = "50%";
          el.style.border = "2px solid white";
          el.style.boxShadow = "0 0 0 1px rgba(0,0,0,0.2)";
          el.style.background = color;

          new mapboxgl.default.Marker({ element: el })
            .setLngLat([loc.longitude, loc.latitude])
            .setPopup(new mapboxgl.default.Popup({ offset: 12 }).setHTML(`<strong>${loc.name}</strong><br/>${label}`))
            .addTo(map);
        }

        for (const resource of emergencyResources) {
          const el = document.createElement("div");
          el.style.width = "10px";
          el.style.height = "10px";
          el.style.borderRadius = "2px";
          el.style.background = RESOURCE_COLOR[resource.type];

          new mapboxgl.default.Marker({ element: el })
            .setLngLat([resource.longitude, resource.latitude])
            .setPopup(new mapboxgl.default.Popup({ offset: 8 }).setHTML(`<strong>${resource.name}</strong><br/>${resource.type.replace("_", " ")}`))
            .addTo(map);
        }
      })
      .catch(() => {
        if (!cancelled) setError("The map failed to load. Please refresh the page.");
      });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [mapConfig.clientToken, mapConfig.styleUrl, locations, emergencyResources]);

  if (!mapConfig.clientToken) {
    return (
      <Alert variant="error">
        Map is not configured for this environment (missing public Mapbox token). Location risk data is still listed below.
      </Alert>
    );
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-xl border border-border">
      {!loaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-muted" aria-busy="true">
          <span className="text-sm text-foreground-muted">Loading map…</span>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
