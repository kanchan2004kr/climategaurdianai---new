"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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

export interface GovernmentReportView {
  id: string;
  type: string;
  severity: string;
  description: string;
  status: string;
  locationName: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export function ReportReviewRow({ report }: { report: GovernmentReportView }) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(status: string) {
    setUpdating(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update report");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update report.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <li className="rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">{TYPE_LABEL[report.type] ?? report.type}</p>
          <p className="mt-0.5 text-xs text-foreground-muted">{report.description}</p>
        </div>
        <Badge variant="neutral">{report.status}</Badge>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
        <Badge variant="neutral">{report.severity}</Badge>
        <span>{report.locationName ?? "Unknown location"}</span>
        <span>· {formatRelativeMinutes(report.createdAt)}</span>
        {report.reviewedByName && <span>· Reviewed by {report.reviewedByName}</span>}
      </div>

      {error && <p className="mt-2 text-xs text-risk-high">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={updating || report.status === "UNDER_REVIEW"} onClick={() => setStatus("UNDER_REVIEW")}>
          Mark under review
        </Button>
        <Button size="sm" variant="outline" disabled={updating || report.status === "VERIFIED"} onClick={() => setStatus("VERIFIED")}>
          Verify
        </Button>
        <Button size="sm" variant="outline" disabled={updating || report.status === "REJECTED"} onClick={() => setStatus("REJECTED")}>
          Reject
        </Button>
        <Button size="sm" variant="outline" disabled={updating || report.status === "RESOLVED"} onClick={() => setStatus("RESOLVED")}>
          Resolve
        </Button>
      </div>
    </li>
  );
}
