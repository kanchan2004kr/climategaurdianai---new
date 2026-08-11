import { getHealthActionPlan } from "@/lib/services/dashboard/get-health-action-plan";
import { AIClimateBrief } from "@/components/dashboard/ai-climate-brief";
import { AIBriefSkeleton } from "@/components/dashboard/ai-brief-section";

/** Async server component streamed inside <Suspense> on /health. */
export async function ActionPlanSection({ userId, locationId }: { userId: string; locationId?: string }) {
  const plan = await getHealthActionPlan(userId, locationId);
  return <AIClimateBrief content={plan.content} isFallback={plan.isFallback} disclaimer={plan.disclaimer} />;
}

export { AIBriefSkeleton as ActionPlanSkeleton };
