import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getDiseaseRiskDetail } from "@/lib/services/dashboard/get-risk-detail";
import { RiskDetailHeader } from "@/components/dashboard/risk-detail/detail-header";
import { FactorBreakdown } from "@/components/dashboard/risk-detail/factor-breakdown";
import { RiskTrendChart } from "@/components/dashboard/risk-trend-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge, riskVariant } from "@/components/ui/badge";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = { title: "Disease Environmental Risk" };

export default async function DiseaseRiskPage(props: PageProps<"/risks/disease">) {
  const session = await auth();
  if (!session?.user) return null;

  const searchParams = await props.searchParams;
  const requestedLocation = typeof searchParams.location === "string" ? searchParams.location : undefined;

  let data;
  try {
    data = await getDiseaseRiskDetail(session.user.id, requestedLocation);
  } catch {
    return <Alert variant="error">Environmental risk data is temporarily unavailable. Please try again shortly.</Alert>;
  }

  const { risk, weather, location, trend } = data;
  const maxScore = Math.max(risk.dengue.score, risk.malaria.score);
  const maxLevel = risk.dengue.score >= risk.malaria.score ? risk.dengue.level : risk.malaria.level;

  return (
    <div className="flex flex-col gap-6">
      <RiskDetailHeader
        title="Disease Environmental Risk"
        score={maxScore}
        level={maxLevel}
        locationName={location.name}
        updatedAt={weather.recordedAt}
        isDemoData={weather.isDemoData}
      />

      <Reveal>
        <Alert variant="warning">{risk.disclaimer}</Alert>
      </Reveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Reveal>
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Dengue</CardTitle>
                <CardDescription>{risk.dengue.label}</CardDescription>
              </div>
              <Badge variant={riskVariant(risk.dengue.level)}>{risk.dengue.level}</Badge>
            </CardHeader>
            <CardContent>
              <p className="tabular mb-3 text-2xl font-semibold text-foreground">{risk.dengue.score}</p>
              <FactorBreakdown factors={risk.dengue.factors} />
            </CardContent>
          </Card>
        </Reveal>

        <Reveal direction="left">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">Malaria</CardTitle>
                <CardDescription>{risk.malaria.label}</CardDescription>
              </div>
              <Badge variant={riskVariant(risk.malaria.level)}>{risk.malaria.level}</Badge>
            </CardHeader>
            <CardContent>
              <p className="tabular mb-3 text-2xl font-semibold text-foreground">{risk.malaria.score}</p>
              <FactorBreakdown factors={risk.malaria.factors} />
            </CardContent>
          </Card>
        </Reveal>
      </div>

      <Reveal>
        <RiskTrendChart trend={trend} title="Disease environmental risk trend" />
      </Reveal>
    </div>
  );
}
