import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { auth } from "@/lib/auth";
import { getRiskMapData } from "@/lib/services/dashboard/get-risk-map-data";
import { RiskMapView } from "@/components/map/risk-map-view";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, riskVariant } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Reveal } from "@/components/motion/reveal";
import { formatRelativeMinutes } from "@/lib/utils/time";

export const metadata: Metadata = { title: "Climate Risk Map" };

export default async function RiskMapPage() {
  const session = await auth();
  if (!session?.user) return null;

  let data;
  try {
    data = await getRiskMapData(session.user.id);
  } catch {
    return <Alert variant="error">The climate risk map is temporarily unavailable. Please try again shortly.</Alert>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Climate Risk Map</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Your saved locations plotted with their most recently computed risk level, alongside nearby hospitals,
          shelters and water points.
        </p>
      </div>

      {data.locations.length === 0 ? (
        <Reveal>
          <Card>
            <CardContent className="flex items-center gap-2 p-6 text-sm text-foreground-muted">
              <MapPin className="size-5 text-foreground-muted" />
              No locations available yet. Add a location from your dashboard to see it on the map.
            </CardContent>
          </Card>
        </Reveal>
      ) : (
        <Reveal>
          <RiskMapView
            mapConfig={data.mapConfig}
            center={data.center}
            locations={data.locations}
            emergencyResources={data.emergencyResources}
          />
        </Reveal>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-foreground-muted">
        <span className="font-medium text-foreground">Legend:</span>
        <span className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-full bg-risk-low" /> Low</span>
        <span className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-full bg-risk-moderate" /> Moderate</span>
        <span className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-full bg-risk-elevated" /> Elevated</span>
        <span className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-full bg-risk-high" /> High</span>
        <span className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-full bg-risk-extreme" /> Extreme</span>
        <span className="ml-2 flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-sm" style={{ background: "#3b82f6" }} /> Hospital</span>
        <span className="flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-sm" style={{ background: "#8b5cf6" }} /> Shelter</span>
        <span className="flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-sm" style={{ background: "#06b6d4" }} /> Water point</span>
        <span className="ml-auto italic">Facility pins are seed/demo data.</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.locations.map((loc) => (
          <Reveal key={loc.id}>
            <Card>
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-foreground">{loc.name}</p>
                  {loc.overallLevel ? (
                    <Badge variant={riskVariant(loc.overallLevel as "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "EXTREME")}>
                      {loc.overallLevel}
                    </Badge>
                  ) : (
                    <Badge variant="neutral">No data yet</Badge>
                  )}
                </div>
                <p className="text-xs text-foreground-muted">
                  {loc.overallScore !== null
                    ? `Score ${Math.round(loc.overallScore)} · updated ${formatRelativeMinutes(loc.computedAt as string)}`
                    : "Visit this location on the dashboard to compute a risk score."}
                </p>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
