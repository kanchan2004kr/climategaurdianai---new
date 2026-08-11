import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge, riskVariant } from "@/components/ui/badge";
import type { RiskLevel } from "@/lib/types/risk";
import { formatRelativeMinutes } from "@/lib/utils/time";

export function RiskDetailHeader({
  title,
  score,
  level,
  locationName,
  updatedAt,
  isDemoData,
}: {
  title: string;
  score: number;
  level: RiskLevel;
  locationName: string;
  updatedAt: string;
  isDemoData: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Link href="/dashboard" className="flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground">
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {locationName} · {formatRelativeMinutes(updatedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="tabular text-3xl font-semibold text-foreground">{Math.round(score)}</span>
          <Badge variant={riskVariant(level)}>{level}</Badge>
          {isDemoData && <Badge variant="neutral">Demo data</Badge>}
        </div>
      </div>
    </div>
  );
}
