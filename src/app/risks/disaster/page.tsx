import type { Metadata } from "next";
import { CloudRain, Wind, Flame, Zap, Waves } from "lucide-react";
import { auth } from "@/lib/auth";
import { getDisasterRiskDetail } from "@/lib/services/dashboard/get-risk-detail";
import { RiskDetailHeader } from "@/components/dashboard/risk-detail/detail-header";
import { RiskTrendChart } from "@/components/dashboard/risk-trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge, riskVariant } from "@/components/ui/badge";
import { Reveal } from "@/components/motion/reveal";
import { StaggerContainer, StaggerItem } from "@/components/motion/stagger-container";

export const metadata: Metadata = { title: "Disaster Risk" };

const TYPE_ICON: Record<string, typeof Waves> = {
  FLOOD: Waves,
  EXTREME_RAINFALL: CloudRain,
  CYCLONE: Wind,
  WILDFIRE: Flame,
  LIGHTNING: Zap,
};

const TYPE_LABEL: Record<string, string> = {
  FLOOD: "Flood",
  EXTREME_RAINFALL: "Extreme rainfall",
  CYCLONE: "Cyclone",
  WILDFIRE: "Wildfire",
  LIGHTNING: "Lightning",
};

export default async function DisasterRiskPage(props: PageProps<"/risks/disaster">) {
  const session = await auth();
  if (!session?.user) return null;

  const searchParams = await props.searchParams;
  const requestedLocation = typeof searchParams.location === "string" ? searchParams.location : undefined;

  let data;
  try {
    data = await getDisasterRiskDetail(session.user.id, requestedLocation);
  } catch {
    return <Alert variant="error">Disaster risk data is temporarily unavailable. Please try again shortly.</Alert>;
  }

  const { risk, weather, location, trend } = data;
  const maxItem = risk.items.reduce((max, item) => (item.score > max.score ? item : max), risk.items[0]);

  return (
    <div className="flex flex-col gap-6">
      <RiskDetailHeader
        title="Disaster Risk"
        score={maxItem.score}
        level={maxItem.level}
        locationName={location.name}
        updatedAt={weather.recordedAt}
        isDemoData={risk.isDemoData}
      />

      <Reveal>
        <Alert variant="warning">{risk.disclaimer}</Alert>
      </Reveal>

      <StaggerContainer className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {risk.items.map((item) => {
          const Icon = TYPE_ICON[item.type] ?? Waves;
          return (
            <StaggerItem key={item.type}>
              <Card className="h-full">
                <CardContent className="flex flex-col gap-2 p-4">
                  <Icon className="size-5 text-brand" />
                  <p className="text-sm font-medium text-foreground-muted">{TYPE_LABEL[item.type] ?? item.type}</p>
                  <p className="tabular text-2xl font-semibold text-foreground">{item.score}</p>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={riskVariant(item.level)}>{item.level}</Badge>
                    <Badge variant="neutral">Modelled risk</Badge>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      <Reveal>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Official alerts vs. this model</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-foreground-muted">
            The scores above are <strong className="text-foreground">modelled estimates</strong> derived from
            current weather conditions — they are not official government warnings. If an official alert exists
            for your area, it will appear separately on your dashboard&apos;s Active Alerts panel, labelled{" "}
            <strong className="text-foreground">Official alert</strong>.
          </CardContent>
        </Card>
      </Reveal>

      <Reveal>
        <RiskTrendChart trend={trend} title="Disaster risk trend" />
      </Reveal>
    </div>
  );
}
