import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { auth } from "@/lib/auth";
import { getEmergencyData } from "@/lib/services/dashboard/get-emergency-data";
import { getMapProvider } from "@/lib/providers/maps";
import { LocationSwitcher } from "@/components/dashboard/location-switcher";
import { EmergencyResourceList } from "@/components/emergency/emergency-resource-list";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

  const mapConfig = getMapProvider().getClientConfig();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Emergency Resources</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Hospitals, shelters and water points near {data.location.name}, sorted by distance.
          </p>
        </div>
        <LocationSwitcher locations={data.availableLocations} currentId={data.location.id} />
      </div>

      {!mapConfig.clientToken && (
        <Reveal>
          <Card>
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <MapPin className="size-4 text-foreground-muted" />
              <div>
                <CardTitle className="text-base">Interactive map not configured</CardTitle>
                <CardDescription>
                  Set a public <code>MAPBOX_TOKEN</code> to enable an interactive map view. Showing the
                  distance-sorted list below in the meantime — nothing here is fabricated.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Reveal>
      )}

      <Reveal>
        <Card>
          <CardContent className="p-6">
            <EmergencyResourceList resources={data.resources} />
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}
