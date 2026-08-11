import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { getEmergencyData } from "@/lib/services/dashboard/get-emergency-data";
import { LocationSwitcher } from "@/components/dashboard/location-switcher";
import { EmergencyResourceList } from "@/components/emergency/emergency-resource-list";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = { title: "Emergency Resources" };

export default async function EmergencyPage(props: PageProps<"/emergency">) {
  const session = await auth();
  if (!session?.user) return null;

  const searchParams = await props.searchParams;
  const requestedLocation = typeof searchParams.location === "string" ? searchParams.location : undefined;

  let data;
  try {
    data = await getEmergencyData(session.user.id, requestedLocation);
  } catch {
    return <Alert variant="error">Emergency resource data is temporarily unavailable. Please try again shortly.</Alert>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Emergency Resources</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Hospitals, shelters and water points within {data.radiusKm} km of {data.location.name}, sorted by distance.
          </p>
        </div>
        <LocationSwitcher locations={data.availableLocations} currentId={data.location.id} />
      </div>

      {data.isSeedData && data.resources.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-foreground-muted">
          <Badge variant="neutral">Demo/seed facility data</Badge>
          <span>These facilities are seeded reference records, not a live directory.</span>
        </div>
      )}

      {data.resources.length === 0 ? (
        <Reveal>
          <Card>
            <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
              <ShieldCheck className="size-6 text-foreground-muted" />
              <p className="text-sm font-medium text-foreground">No verified nearby facilities found</p>
              <p className="max-w-sm text-sm text-foreground-muted">
                There are no facilities in our current data within {data.radiusKm} km of {data.location.name}. Try a
                different location, or contact local emergency services directly.
              </p>
            </CardContent>
          </Card>
        </Reveal>
      ) : (
        <Reveal>
          <Card>
            <CardContent className="p-6">
              <EmergencyResourceList resources={data.resources} />
            </CardContent>
          </Card>
        </Reveal>
      )}
    </div>
  );
}
