import Link from "next/link";
import { HeartPulse, Leaf, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCarbonData } from "@/lib/services/carbon/get-carbon-summary";

export async function PersonalizationLinks({ userId }: { userId: string }) {
  const [profile, carbon] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    getCarbonData(userId, 7),
  ]);

  const profileComplete = Boolean(profile && profile.vulnerabilityCategory !== "NONE");

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Link
        href="/health"
        className="group flex items-center justify-between rounded-xl border border-border bg-surface p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
      >
        <div className="flex flex-1 items-center gap-3">
          <HeartPulse className="size-5 text-brand" />
          <div>
            <p className="text-sm font-medium text-foreground">Personal Climate Health</p>
            <p className="text-xs text-foreground-muted">
              {profileComplete ? "Personalized risk active" : "Set up your profile for personalized risk"}
            </p>
          </div>
        </div>
        <ChevronRight className="size-4 text-foreground-muted transition-transform duration-150 group-hover:translate-x-0.5" />
      </Link>

      <Link
        href="/carbon"
        className="group flex items-center justify-between rounded-xl border border-border bg-surface p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
      >
        <div className="flex flex-1 items-center gap-3">
          <Leaf className="size-5 text-brand" />
          <div>
            <p className="text-sm font-medium text-foreground">Carbon Wallet</p>
            <p className="text-xs text-foreground-muted">
              {carbon.summary.totalCo2eKg > 0
                ? `${carbon.summary.totalCo2eKg.toFixed(1)} kg CO₂e this week`
                : "Track your footprint"}
            </p>
          </div>
        </div>
        <ChevronRight className="size-4 text-foreground-muted transition-transform duration-150 group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
