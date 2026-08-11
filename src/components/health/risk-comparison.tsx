import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge, riskVariant } from "@/components/ui/badge";
import type { RiskResult } from "@/lib/types/risk";

interface ComparisonRowProps {
  label: string;
  baseline: RiskResult;
  personalized?: RiskResult;
  supported: boolean;
}

function ComparisonRow({ label, baseline, personalized, supported }: ComparisonRowProps) {
  const changed = supported && personalized && personalized.score !== baseline.score;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {!supported && (
          <p className="mt-0.5 text-xs text-foreground-muted">Personalization not yet supported for this category.</p>
        )}
        {changed && (
          <p className="mt-0.5 text-xs text-brand">Your profile increases sensitivity to this category.</p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-[11px] uppercase tracking-wide text-foreground-muted">Environmental</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="tabular text-lg font-semibold text-foreground">{baseline.score}</span>
            <Badge variant={riskVariant(baseline.level)}>{baseline.level}</Badge>
          </div>
        </div>
        {supported && personalized && (
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-wide text-foreground-muted">Your risk</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="tabular text-lg font-semibold text-foreground">{personalized.score}</span>
              <Badge variant={riskVariant(personalized.level)}>{personalized.level}</Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function RiskComparison({
  baseline,
  personalized,
}: {
  baseline: { air: RiskResult; heat: RiskResult; overall: RiskResult };
  personalized: { air: RiskResult; heat: RiskResult; overall: RiskResult };
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Environmental risk vs. your personalized risk</CardTitle>
        <CardDescription>
          Personalization currently applies to Air and Heat, using your profile&apos;s vulnerability category, age
          group and outdoor-worker status.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ComparisonRow label="Overall" baseline={baseline.overall} personalized={personalized.overall} supported />
        <ComparisonRow label="Air" baseline={baseline.air} personalized={personalized.air} supported />
        <ComparisonRow label="Heat" baseline={baseline.heat} personalized={personalized.heat} supported />
      </CardContent>
    </Card>
  );
}
