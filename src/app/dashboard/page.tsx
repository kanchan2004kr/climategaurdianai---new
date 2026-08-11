import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/lib/services/dashboard/get-dashboard-data";
import { ClimateHealthScore } from "@/components/dashboard/climate-health-score";
import { RiskCategoryGrid } from "@/components/dashboard/risk-category-grid";
import { CurrentConditions } from "@/components/dashboard/current-conditions";
import { AIBriefSection, AIBriefSkeleton } from "@/components/dashboard/ai-brief-section";
import { ActiveAlerts } from "@/components/dashboard/active-alerts";
import { RiskTrendChart } from "@/components/dashboard/risk-trend-chart";
import { EmergencyPreview } from "@/components/dashboard/emergency-preview";
import { PersonalizationLinks } from "@/components/dashboard/personalization-links";
import { LocationSwitcher } from "@/components/dashboard/location-switcher";
import { RefreshButton } from "@/components/dashboard/refresh-button";
import { ForecastCard } from "@/components/dashboard/forecast-card";
import { RiskComparison } from "@/components/health/risk-comparison";
import { Reveal } from "@/components/motion/reveal";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { formatRelativeMinutes } from "@/lib/utils/time";

export const metadata: Metadata = {
  title: "Dashboard",
};

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const session = await auth();
  const searchParams = await props.searchParams;
  const requestedLocation = typeof searchParams.location === "string" ? searchParams.location : undefined;

  if (!session?.user) {
    return null; // layout already redirects unauthenticated users to /login
  }

  let data;
  try {
    data = await getDashboardData(session.user.id, requestedLocation);
  } catch (error) {
    if (error instanceof Error && error.message === "NO_LOCATION_AVAILABLE") {
      return (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border text-center">
          <p className="text-sm font-medium text-foreground">No location set up yet</p>
          <p className="max-w-sm text-sm text-foreground-muted">
            Set a location in your Climate Health Profile to see personalized risk here.
          </p>
          <Link href="/health" className={buttonVariants({ size: "sm" })}>
            Set up your profile
          </Link>
        </div>
      );
    }

    return (
      <Alert variant="error">
        Climate data is temporarily unavailable. Please try refreshing in a moment.
      </Alert>
    );
  }

  const greeting = greetingForHour(new Date().getHours());

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {greeting}
            {session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            {data.location.name}
            {data.location.region ? `, ${data.location.region}` : ""} · {formatRelativeMinutes(data.generatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LocationSwitcher locations={data.availableLocations} currentId={data.location.id} />
          <RefreshButton />
        </div>
      </div>

      <Reveal>
        <div className="rounded-xl border border-border bg-surface p-6">
          <ClimateHealthScore
            score={data.overall.score}
            level={data.overall.level}
            summary={data.overall.summary}
            isDemoData={data.overall.isDemoData}
          />
        </div>
      </Reveal>

      <Reveal>
        <PersonalizationLinks userId={session.user.id} />
      </Reveal>

      <RiskCategoryGrid
        air={data.categories.air.score}
        heat={data.categories.heat.score}
        water={data.categories.water.score}
        disease={data.categories.disease.dengueScore > data.categories.disease.malariaScore ? data.categories.disease.dengueScore : data.categories.disease.malariaScore}
        disaster={data.categories.disaster.maxScore}
      />

      {data.hasVulnerabilityProfile && (
        <Reveal>
          <RiskComparison baseline={data.baseline} personalized={{ air: data.categories.air, heat: data.categories.heat, overall: data.overall }} />
        </Reveal>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Reveal>
            <CurrentConditions weather={data.weather} air={data.air} />
          </Reveal>
          <Reveal>
            <ForecastCard forecast={data.forecast} />
          </Reveal>
          <Reveal>
            <RiskTrendChart trend={data.trend} />
          </Reveal>
          <Reveal>
            <EmergencyPreview resources={data.emergencyPreview} />
          </Reveal>
        </div>
        <div className="flex flex-col gap-6">
          <Reveal direction="left">
            <Suspense fallback={<AIBriefSkeleton />}>
              <AIBriefSection userId={session.user.id} locationId={data.location.id} />
            </Suspense>
          </Reveal>
          <Reveal direction="left" delay={0.05}>
            <ActiveAlerts alerts={data.activeAlerts} locationName={data.location.name} />
          </Reveal>
        </div>
      </div>
    </div>
  );
}
