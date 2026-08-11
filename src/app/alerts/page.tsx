import type { Metadata } from "next";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { getAlertsData } from "@/lib/services/dashboard/get-alerts-data";
import { LocationSwitcher } from "@/components/dashboard/location-switcher";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, riskVariant } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Reveal } from "@/components/motion/reveal";
import { formatRelativeMinutes } from "@/lib/utils/time";
import { scoreToLevel } from "@/lib/types/risk";

export const metadata: Metadata = { title: "Alert Center" };

const SOURCE_LABEL: Record<string, string> = {
  OFFICIAL_ALERT: "Official alert",
  MODELLED_RISK: "Modelled risk",
  USER_REPORT: "User report",
};

const SEVERITY_VARIANT: Record<string, "low" | "moderate" | "elevated" | "high" | "extreme"> = {
  INFO: "low",
  WARNING: "moderate",
  SEVERE: "high",
  EXTREME: "extreme",
};

export default async function AlertsPage(props: PageProps<"/alerts">) {
  const session = await auth();
  if (!session?.user) return null;

  const searchParams = await props.searchParams;
  const requestedLocation = typeof searchParams.location === "string" ? searchParams.location : undefined;

  let data;
  try {
    data = await getAlertsData(session.user.id, requestedLocation);
  } catch {
    return <Alert variant="error">Alerts are temporarily unavailable. Please try again shortly.</Alert>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Alert Center</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Sorted by priority — severity, recency, location relevance and your personal vulnerability.
          </p>
        </div>
        <LocationSwitcher locations={data.availableLocations} currentId={data.location.id} />
      </div>

      {data.alerts.length === 0 ? (
        <Reveal>
          <Card>
            <CardContent className="flex items-center gap-2 p-6 text-sm text-foreground-muted">
              <ShieldCheck className="size-5 text-risk-low" />
              You&apos;re currently clear of active alerts for {data.location.name}.
            </CardContent>
          </Card>
        </Reveal>
      ) : (
        <div className="flex flex-col gap-3">
          {data.alerts.map((alert) => (
            <Reveal key={alert.id}>
              <Card>
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="mt-0.5 size-5 shrink-0 text-risk-elevated" />
                      <div>
                        <p className="font-medium text-foreground">{alert.title}</p>
                        <p className="mt-0.5 text-sm text-foreground-muted">{alert.message}</p>
                      </div>
                    </div>
                    <Badge variant={SEVERITY_VARIANT[alert.severity] ?? "moderate"}>{alert.severity}</Badge>
                  </div>

                  <div className="rounded-lg border border-border bg-surface-muted/50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Recommended action</p>
                    <p className="mt-1 text-sm text-foreground">{alert.recommendedAction}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
                    <Badge variant={alert.source === "OFFICIAL_ALERT" ? "brand" : "neutral"}>
                      {SOURCE_LABEL[alert.source] ?? alert.source}
                    </Badge>
                    <Badge variant={riskVariant(scoreToLevel(alert.priorityScore))}>Priority {alert.priorityScore}</Badge>
                    <span>{data.location.name}</span>
                    <span>· {formatRelativeMinutes(alert.createdAt)}</span>
                    {alert.expiresAt && <span>· Expires {new Date(alert.expiresAt).toLocaleString()}</span>}
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
