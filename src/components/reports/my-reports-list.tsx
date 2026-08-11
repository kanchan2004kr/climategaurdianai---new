import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeMinutes } from "@/lib/utils/time";

const TYPE_LABEL: Record<string, string> = {
  FLOODING: "Flooding",
  EXTREME_HEAT: "Extreme heat",
  SEVERE_POLLUTION: "Severe pollution",
  WATER_SHORTAGE: "Water shortage",
  WILDFIRE_SMOKE: "Wildfire / smoke",
  UNSAFE_WATER: "Unsafe water",
  INFRASTRUCTURE_DAMAGE: "Infrastructure damage",
  OTHER: "Other",
};

export interface MyReportView {
  id: string;
  type: string;
  severity: string;
  status: string;
  description: string;
  createdAt: string;
}

function isVerifiedStatus(status: string) {
  return status === "VERIFIED" || status === "RESOLVED";
}

export function MyReportsList({ reports }: { reports: MyReportView[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your reports</CardTitle>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <p className="text-sm text-foreground-muted">You haven&apos;t submitted any reports yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {reports.map((r) => (
              <li key={r.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{TYPE_LABEL[r.type] ?? r.type}</p>
                    <p className="mt-0.5 text-xs text-foreground-muted">{r.description}</p>
                  </div>
                  <Badge variant="neutral">{r.status}</Badge>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-foreground-muted">
                  <Badge variant={isVerifiedStatus(r.status) ? "brand" : "neutral"}>
                    {isVerifiedStatus(r.status) ? "USER REPORT — VERIFIED" : "USER REPORT — UNVERIFIED"}
                  </Badge>
                  <span>{formatRelativeMinutes(r.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
