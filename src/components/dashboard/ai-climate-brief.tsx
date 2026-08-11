"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STEPS = ["Weather", "Air quality", "Heat exposure", "Environmental risk", "Personal vulnerability"];
const STEP_INTERVAL_MS = 90;

interface AIClimateBriefProps {
  content: string;
  isFallback: boolean;
  disclaimer?: string;
}

/**
 * The AI content itself is already computed server-side by the time this
 * mounts — this only plays a brief, real processing indicator (not a fake
 * delay) before revealing it, communicating "this brief was assembled from
 * these real inputs" rather than simulating a chatbot typing.
 */
export function AIClimateBrief({ content, isFallback, disclaimer }: AIClimateBriefProps) {
  const [stepIndex, setStepIndex] = useState(-1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setStepIndex(i - 1);
      if (i >= STEPS.length) {
        clearInterval(interval);
        setTimeout(() => setReady(true), 150);
      }
    }, STEP_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-brand" />
          AI Climate Brief
        </CardTitle>
        {isFallback ? <Badge variant="neutral">Rule-based fallback</Badge> : <Badge variant="brand">AI summary</Badge>}
      </CardHeader>
      <CardContent>
        {!ready ? (
          <ul className="flex flex-col gap-1.5 text-sm text-foreground-muted" aria-live="polite">
            {STEPS.map((step, i) => (
              <li key={step} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-4 items-center justify-center rounded-full border border-border transition-colors duration-150",
                    i <= stepIndex && "border-brand bg-brand text-brand-foreground"
                  )}
                >
                  {i <= stepIndex && <Check className="size-3" />}
                </span>
                <span className={cn(i <= stepIndex ? "text-foreground" : undefined)}>{step}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="reveal reveal-visible" style={{ "--reveal-duration": "0.25s" } as React.CSSProperties}>
            <p className="text-sm text-foreground">{content}</p>
            {disclaimer && <p className="mt-3 text-xs text-foreground-muted">{disclaimer}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
