import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getAirRiskDetail } from "@/lib/services/dashboard/get-risk-detail";
import { airPrecautions } from "@/lib/services/dashboard/precautions";
import { RiskDetailHeader } from "@/components/dashboard/risk-detail/detail-header";
import { FactorBreakdown } from "@/components/dashboard/risk-detail/factor-breakdown";
import { RiskTrendChart } from "@/components/dashboard/risk-trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = { title: "Air Risk" };

export default async function AirRiskPage(props: PageProps<"/risks/air">) {
  const session = await auth();
  if (!session?.user) return null;

  const searchParams = await props.searchParams;
  const requestedLocation = typeof searchParams.location === "string" ? searchParams.location : undefined;

  let data;
  try {
    data = await getAirRiskDetail(session.user.id, requestedLocation);
  } catch {
    return <Alert variant="error">Air quality data is temporarily unavailable. Please try again shortly.</Alert>;
  }

  const { risk, weather, air, location, trend } = data;

  return (
    <div className="flex flex-col gap-6">
      <RiskDetailHeader
        title="Air Risk"
        score={risk.score}
        level={risk.level}
        locationName={location.name}
        updatedAt={air.recordedAt}
        isDemoData={risk.isDemoData}
      />

      <Reveal>
        <Alert variant="info">{risk.summary}</Alert>
      </Reveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Reveal>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current air quality</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Metric label="AQI" value={air.aqi} />
              <Metric label="PM2.5" value={air.pm25} unit=" µg/m³" />
              <Metric label="PM10" value={air.pm10} unit=" µg/m³" />
              <Metric label="O3" value={air.o3} unit=" µg/m³" />
              <Metric label="NO2" value={air.no2} unit=" µg/m³" />
              <Metric label="Wind" value={weather.windSpeed} unit=" km/h" />
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
              {airPrecautions(risk.level).map((p) => (
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
        <RiskTrendChart trend={trend} title="Air risk trend" />
      </Reveal>
    </div>
  );
}

function Metric({ label, value, unit = "" }: { label: string; value: number | null; unit?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-muted/50 p-3">
      <p className="text-xs text-foreground-muted">{label}</p>
      <p className="tabular text-lg font-semibold text-foreground">
        {value == null ? "—" : `${Math.round(value * 10) / 10}${unit}`}
      </p>
    </div>
  );
}
