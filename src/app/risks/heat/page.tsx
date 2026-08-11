import type { Metadata } from "next";
import { Sunrise, Sunset, Thermometer } from "lucide-react";
import { auth } from "@/lib/auth";
import { getHeatRiskDetail } from "@/lib/services/dashboard/get-risk-detail";
import { heatPrecautions } from "@/lib/services/dashboard/precautions";
import { RiskDetailHeader } from "@/components/dashboard/risk-detail/detail-header";
import { FactorBreakdown } from "@/components/dashboard/risk-detail/factor-breakdown";
import { RiskTrendChart } from "@/components/dashboard/risk-trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = { title: "Heat Risk" };

export default async function HeatRiskPage(props: PageProps<"/risks/heat">) {
  const session = await auth();
  if (!session?.user) return null;

  const searchParams = await props.searchParams;
  const requestedLocation = typeof searchParams.location === "string" ? searchParams.location : undefined;

  let data;
  try {
    data = await getHeatRiskDetail(session.user.id, requestedLocation);
  } catch {
    return <Alert variant="error">Weather data is temporarily unavailable. Please try again shortly.</Alert>;
  }

  const { risk, weather, location, trend } = data;

  return (
    <div className="flex flex-col gap-6">
      <RiskDetailHeader
        title="Heat Risk"
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
              <CardTitle className="text-base">Heat conditions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-surface-muted/50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
                  <Thermometer className="size-3.5" />
                  Feels like
                </div>
                <p className="tabular text-lg font-semibold text-foreground">{risk.heatIndexCelsius}°C</p>
              </div>
              <div className="rounded-lg border border-border bg-surface-muted/50 p-3">
                <p className="text-xs text-foreground-muted">Actual temperature</p>
                <p className="tabular text-lg font-semibold text-foreground">{weather.temperature.toFixed(1)}°C</p>
              </div>
              <div className="col-span-2 flex items-center gap-2 rounded-lg border border-border bg-surface-muted/50 p-3">
                <Sunset className="size-4 text-risk-elevated" />
                <div>
                  <p className="text-xs text-foreground-muted">Peak heat period</p>
                  <p className="text-sm font-medium text-foreground">{risk.peakHeatPeriod}</p>
                </div>
              </div>
              <div className="col-span-2 flex items-center gap-2 rounded-lg border border-border bg-surface-muted/50 p-3">
                <Sunrise className="size-4 text-risk-low" />
                <div>
                  <p className="text-xs text-foreground-muted">Safer activity windows</p>
                  <p className="text-sm font-medium text-foreground">{risk.saferActivityPeriods.join(" · ")}</p>
                </div>
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
            <CardTitle className="text-base">Hydration &amp; heat precautions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
              {heatPrecautions(risk.level).map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-foreground-muted">
              General environmental guidance, not medical advice or a diagnosis.
            </p>
          </CardContent>
        </Card>
      </Reveal>

      <Reveal>
        <RiskTrendChart trend={trend} title="Heat risk trend" />
      </Reveal>
    </div>
  );
}
