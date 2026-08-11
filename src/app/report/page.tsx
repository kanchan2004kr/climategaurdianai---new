import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { resolveLocation } from "@/lib/services/dashboard/locations";
import { getUserReports } from "@/lib/services/reports";
import { ReportForm } from "@/components/reports/report-form";
import { MyReportsList } from "@/components/reports/my-reports-list";
import { Alert } from "@/components/ui/alert";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = { title: "Report an Observation" };

export default async function ReportPage(props: PageProps<"/report">) {
  const session = await auth();
  if (!session?.user) return null;

  const searchParams = await props.searchParams;
  const requestedLocation = typeof searchParams.location === "string" ? searchParams.location : undefined;

  const location = await resolveLocation(session.user.id, requestedLocation);
  const reports = await getUserReports(session.user.id);

  if (!location) {
    return <Alert variant="error">Set up a location in your Health Profile before submitting a report.</Alert>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Report an Observation</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Help others by reporting climate-related conditions you&apos;re observing. Reports are reviewed by
          government users before being marked verified.
        </p>
      </div>

      <Reveal>
        <div className="rounded-xl border border-border bg-surface p-6">
          <ReportForm
            defaultLatitude={location.latitude}
            defaultLongitude={location.longitude}
            locationId={location.id}
            locationName={location.name}
          />
        </div>
      </Reveal>

      <Reveal>
        <MyReportsList
          reports={reports.map((r) => ({
            id: r.id,
            type: r.type,
            severity: r.severity,
            status: r.status,
            description: r.description,
            createdAt: r.createdAt.toISOString(),
          }))}
        />
      </Reveal>
    </div>
  );
}
