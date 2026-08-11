import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getHealthProfileData } from "@/lib/services/dashboard/get-health-profile-data";
import { ProfileWizard } from "@/components/health/profile-wizard";
import { RiskComparison } from "@/components/health/risk-comparison";
import { AIClimateBrief } from "@/components/dashboard/ai-climate-brief";
import { Alert } from "@/components/ui/alert";
import { Reveal } from "@/components/motion/reveal";

export const metadata: Metadata = { title: "Health Profile" };

export default async function HealthPage(props: PageProps<"/health">) {
  const session = await auth();
  if (!session?.user) return null;

  const searchParams = await props.searchParams;
  const requestedLocation = typeof searchParams.location === "string" ? searchParams.location : undefined;

  let data;
  try {
    data = await getHealthProfileData(session.user.id, requestedLocation);
  } catch (error) {
    if (error instanceof Error && error.message === "NO_LOCATION_AVAILABLE") {
      return (
        <div className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center">
          <p className="text-sm font-medium text-foreground">No location set up yet</p>
          <p className="max-w-sm text-sm text-foreground-muted">Set a location below to personalize your risk.</p>
        </div>
      );
    }
    return <Alert variant="error">Climate data is temporarily unavailable. Please try refreshing in a moment.</Alert>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Climate Health Profile</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Personalize your climate risk. This is environmental and public-health guidance — ClimateGuardian is
          not a diagnostic medical system.
        </p>
      </div>

      <ProfileWizard profile={data.profile} locations={data.availableLocations} currentLocationId={data.location.id} />

      <Reveal>
        <RiskComparison baseline={data.baseline} personalized={data.personalized} />
      </Reveal>

      <Reveal direction="left">
        <AIClimateBrief content={data.actionPlan.content} isFallback={data.actionPlan.isFallback} disclaimer={data.actionPlan.disclaimer} />
      </Reveal>
    </div>
  );
}
