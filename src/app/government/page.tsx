import type { Metadata } from "next";
import { Hospital, Home, Droplet, MapPinned } from "lucide-react";
import { getGovernmentData } from "@/lib/services/government/get-government-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge, riskVariant } from "@/components/ui/badge";
import { ReportReviewRow } from "@/components/government/report-review-row";
import { Reveal } from "@/components/motion/reveal";
import { scoreToLevel } from "@/lib/types/risk";
import { formatRelativeMinutes } from "@/lib/utils/time";

export const metadata: Metadata = {
  title: "Government Dashboard",
};

const SOURCE_LABEL: Record<string, string> = {
  OFFICIAL_ALERT: "Official alert",
  MODELLED_RISK: "Modelled risk",
  USER_REPORT: "User report",
};

export default async function GovernmentOverviewPage() {
  const data = await getGovernmentData();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Government Dashboard</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Citizen reports, active alerts and risk hotspots across all tracked locations.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Hospital} label="Hospitals" value={data.emergencyCounts.hospitals} />
        <StatTile icon={Home} label="Shelters" value={data.emergencyCounts.shelters} />
        <StatTile
          icon={Droplet}
          label="Water points"
          value={data.emergencyCounts.waterPoints}
          sub={
            data.emergencyCounts.operationalWaterPointRatio != null
              ? `${Math.round(data.emergencyCounts.operationalWaterPointRatio * 100)}% operational`
              : "Availability unknown"
          }
        />
        <StatTile icon={MapPinned} label="Areas with active alerts" value={data.affectedLocationCount} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Reveal>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Risk hotspots</CardTitle>
              <CardDescription>Most recent overall risk score per location.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.hotspots.length === 0 ? (
                <p className="text-sm text-foreground-muted">No risk data recorded yet.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {data.hotspots.map((h) => (
                    <li key={h.locationId} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                      <span className="font-medium text-foreground">{h.locationName}</span>
                      <div className="flex items-center gap-2">
                        <span className="tabular text-foreground-muted">{Math.round(h.score)}</span>
                        <Badge variant={riskVariant(scoreToLevel(h.score))}>{h.level}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </Reveal>

        <Reveal direction="left">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active alerts</CardTitle>
              <CardDescription>Across all tracked locations.</CardDescription>
            </CardHeader>
            <CardContent>
              {data.activeAlerts.length === 0 ? (
                <p className="text-sm text-foreground-muted">No active alerts right now.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {data.activeAlerts.slice(0, 8).map((a) => (
                    <li key={a.id} className="rounded-lg border border-border p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{a.title}</span>
                        <Badge variant={riskVariant(a.severity === "EXTREME" ? "EXTREME" : a.severity === "SEVERE" ? "HIGH" : a.severity === "WARNING" ? "ELEVATED" : "LOW")}>
                          {a.severity}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-foreground-muted">
                        <Badge variant={a.source === "OFFICIAL_ALERT" ? "brand" : "neutral"}>{SOURCE_LABEL[a.source] ?? a.source}</Badge>
                        <span>{a.locationName ?? "Unknown"}</span>
                        <span>· {formatRelativeMinutes(a.createdAt)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </Reveal>
      </div>

      <Reveal>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Citizen reports</CardTitle>
            <CardDescription>
              Reporter identity is withheld here to protect citizen privacy — review by content and location.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.reports.length === 0 ? (
              <p className="text-sm text-foreground-muted">No citizen reports submitted yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {data.reports.map((r) => (
                  <ReportReviewRow
                    key={r.id}
                    report={{
                      id: r.id,
                      type: r.type,
                      severity: r.severity,
                      description: r.description,
                      status: r.status,
                      locationName: r.locationName,
                      reviewedByName: r.reviewedByName,
                      reviewedAt: r.reviewedAt,
                      createdAt: r.createdAt,
                    }}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Hospital;
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <Icon className="size-4 text-brand" />
      <p className="mt-2 text-xs text-foreground-muted">{label}</p>
      <p className="tabular text-2xl font-semibold text-foreground">{value}</p>
      {sub && <p className="text-xs text-foreground-muted">{sub}</p>}
    </div>
  );
}
