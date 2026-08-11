import Link from "next/link";
import { Hospital, Home, Droplet, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildDirectionsUrl, type EmergencyResource } from "@/lib/services/emergency-resources";

const TYPE_ICON: Record<string, typeof Hospital> = {
  HOSPITAL: Hospital,
  SHELTER: Home,
  WATER_POINT: Droplet,
  RELIEF_CENTER: Home,
};

export function EmergencyPreview({ resources }: { resources: Array<EmergencyResource & { distanceKm: number }> }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Nearby emergency resources</CardTitle>
        <Link href="/emergency" className="text-xs font-medium text-brand hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {resources.length === 0 ? (
          <p className="text-sm text-foreground-muted">No emergency resources found near this location yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {resources.map((resource) => {
              const Icon = TYPE_ICON[resource.type] ?? Hospital;
              return (
                <li
                  key={resource.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="size-4 shrink-0 text-brand" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{resource.name}</p>
                      <p className="text-xs text-foreground-muted">
                        {resource.type.replace("_", " ")} · {resource.distanceKm} km away
                      </p>
                    </div>
                  </div>
                  <a
                    href={buildDirectionsUrl(resource)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-foreground-muted hover:border-brand hover:text-brand"
                    aria-label={`Get directions to ${resource.name}`}
                  >
                    <Navigation className="size-3" />
                    Directions
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
