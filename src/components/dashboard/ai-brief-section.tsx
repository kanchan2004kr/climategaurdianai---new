import { Sparkles } from "lucide-react";
import { getDashboardAIBrief } from "@/lib/services/dashboard/get-ai-brief";
import { AIClimateBrief } from "./ai-climate-brief";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Async server component streamed inside <Suspense> on the dashboard, so the AI
 * call runs independently of (and after) the main page render. If every provider
 * in the chain fails, generateAIResponse still returns the rule-based fallback,
 * so this never throws the boundary.
 */
export async function AIBriefSection({ userId, locationId }: { userId: string; locationId?: string }) {
  const brief = await getDashboardAIBrief(userId, locationId);
  return <AIClimateBrief content={brief.content} isFallback={brief.isFallback} disclaimer={brief.disclaimer} />;
}

/** Suspense fallback shown while the brief is being generated. */
export function AIBriefSkeleton() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-brand" />
          AI Climate Brief
        </CardTitle>
        <Badge variant="brand">AI summary</Badge>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Generating climate brief">
          <div className="h-3 w-full animate-pulse rounded bg-surface-muted" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-surface-muted" />
          <div className="h-3 w-4/6 animate-pulse rounded bg-surface-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
