"use client";

import { useState } from "react";
import { Hospital, Home, Droplet, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildDirectionsUrl, type EmergencyResourceType } from "@/lib/services/emergency-resources";
import type { EmergencyResourceView } from "@/lib/services/dashboard/get-emergency-data";

const TYPE_ICON: Record<EmergencyResourceType, typeof Hospital> = {
  HOSPITAL: Hospital,
  SHELTER: Home,
  WATER_POINT: Droplet,
  RELIEF_CENTER: Home,
};

const FILTERS: { value: EmergencyResourceType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "HOSPITAL", label: "Hospitals" },
  { value: "SHELTER", label: "Shelters" },
  { value: "WATER_POINT", label: "Water points" },
];

export function EmergencyResourceList({ resources }: { resources: EmergencyResourceView[] }) {
  const [filter, setFilter] = useState<EmergencyResourceType | "ALL">("ALL");

  const visible = filter === "ALL" ? resources : resources.filter((r) => r.type === filter);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by resource type">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? "default" : "outline"}
            onClick={() => setFilter(f.value)}
            aria-pressed={filter === f.value}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-foreground-muted">No resources found for this filter.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((resource) => {
            const Icon = TYPE_ICON[resource.type] ?? Hospital;
            return (
              <li
                key={resource.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4"
              >
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 size-5 shrink-0 text-brand" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{resource.name}</p>
                    <p className="text-xs text-foreground-muted">{resource.address}</p>
                    <p className="mt-0.5 text-xs text-foreground-muted">
                      {resource.distanceKm} km away · {resource.availabilityLabel}
                    </p>
                  </div>
                </div>
                <a
                  href={buildDirectionsUrl(resource)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs text-foreground-muted hover:border-brand hover:text-brand"
                  aria-label={`Get directions to ${resource.name}`}
                >
                  <Navigation className="size-3.5" />
                  Directions
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
