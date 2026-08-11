import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getWaterRiskDetail } from "@/lib/services/dashboard/get-risk-detail";
import { waterPrecautions } from "@/lib/services/dashboard/precautions";
import { RiskDetailHeader } from "@/components/dashboard/risk-detail/detail-header";
import { FactorBreakdown } from "@/components/dashboard/risk-detail/factor-breakdown";
import { RiskTrendChart } from "@/components/dashboard/risk-trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = { title: "Water Risk" };

export default async function WaterRiskPage(props: PageProps<"/risks/water">) {
  const session = await auth();
  if (!session?.user) return null;

  const searchParams = await props.searchParams;
  const requestedLocation = typeof searchParams.location === "string" ? searchParams.location : undefined;

  let data;
  try {
    data = await getWaterRiskDetail(session.user.id, requestedLocation);
  } catch {
    return <Alert variant="error">Water risk data is temporarily unavailable. Please try again shortly.</Alert>;
  }

  const { risk, weather, location, trend, reportCounts, operationalWaterPointRatio } = data;

  return (
    <div className="flex flex-col gap-6">
      <RiskDetailHeader
        title="Water Risk"
        score={risk.score}
        level={risk.level}
        locationName={location.name}
        updatedAt={weather.recordedAt}
        isDemoData={risk.isDemoData}
      />

      <Reveal>
        <Alert variant="info">{risk.summary}</Alert>
      </Reveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Reveal>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rainfall &amp; reports</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-surface-muted/50 p-3">
                <p className="text-xs text-foreground-muted">Recent rainfall</p>
                <p className="tabular text-lg font-semibold text-foreground">{(weather.rainfallMm ?? 0).toFixed(1)} mm</p>
              </div>
              <div className="rounded-lg border border-border bg-surface-muted/50 p-3">
                <p className="text-xs text-foreground-muted">Water points operational</p>
                <p className="tabular text-lg font-semibold text-foreground">
                  {operationalWaterPointRatio == null ? "No data" : `${Math.round(operationalWaterPointRatio * 100)}%`}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-surface-muted/50 p-3">
                <p className="text-xs text-foreground-muted">Contamination reports</p>
                <p className="tabular text-lg font-semibold text-foreground">{reportCounts.contamination}</p>
              </div>
              <div className="rounded-lg border border-border bg-surface-muted/50 p-3">
                <p className="text-xs text-foreground-muted">No-water reports</p>
                <p className="tabular text-lg font-semibold text-foreground">{reportCounts.noWater}</p>
              </div>
              <div className="col-span-2 rounded-lg border border-border bg-surface-muted/50 p-3">
                <p className="text-xs text-foreground-muted">Flooding reports</p>
                <p className="tabular text-lg font-semibold text-foreground">{reportCounts.flooding}</p>
              </div>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal direction="left">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What&apos;s driving this?</CardTitle>
            </CardHeader>
            <CardContent>
              <FactorBreakdown factors={risk.factors} />
            </CardContent>
          </Card>
        </Reveal>
      </div>

      <Reveal>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What to do now</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
              {waterPrecautions(risk.level).map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </Reveal>

      <Reveal>
        <RiskTrendChart trend={trend} title="Water risk trend" />
      </Reveal>
    </div>
  );
}
