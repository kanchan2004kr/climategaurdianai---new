import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeMinutes } from "@/lib/utils/time";

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

export interface AlertItem {
  id: string;
  type: string;
  severity: string;
  source: string;
  title: string;
  message: string;
  createdAt: string;
}

export function ActiveAlerts({ alerts, locationName }: { alerts: AlertItem[]; locationName: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Active alerts</CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-4 text-sm text-foreground-muted">
            <ShieldCheck className="size-4 text-risk-low" />
            You&apos;re currently clear of active alerts for {locationName}.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {alerts.map((alert) => (
              <li key={alert.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 size-4 shrink-0 text-risk-elevated" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{alert.title}</p>
                      <p className="mt-0.5 text-xs text-foreground-muted">{alert.message}</p>
                    </div>
                  </div>
                  <Badge variant={SEVERITY_VARIANT[alert.severity] ?? "moderate"}>{alert.severity}</Badge>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-foreground-muted">
                  <Badge variant="neutral">{SOURCE_LABEL[alert.source] ?? alert.source}</Badge>
                  <span>{formatRelativeMinutes(alert.createdAt)}</span>
                  <span>· {locationName}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
