"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { TrendPoint } from "@/lib/services/dashboard/environment-snapshot";

function formatTick(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function RiskTrendChart({ trend, title = "Overall risk trend" }: { trend: TrendPoint[]; title?: string }) {
  const hasEnoughData = trend.length >= 2;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>From risk scores actually computed and stored for this location.</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasEnoughData ? (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border text-center text-sm text-foreground-muted">
            Not enough history yet for a trend — check back after this location has been viewed a few times.
          </div>
        ) : (
          <div className="h-40 w-full" role="img" aria-label="Line chart of overall climate risk score over time">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="computedAt"
                  tickFormatter={formatTick}
                  stroke="var(--foreground-muted)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis domain={[0, 100]} stroke="var(--foreground-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  labelFormatter={(label) => (typeof label === "string" ? formatTick(label) : String(label ?? ""))}
                  formatter={(value) => [String(value ?? ""), "Score"]}
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--brand)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
