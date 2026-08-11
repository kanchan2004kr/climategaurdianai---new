"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WeatherForecast } from "@/lib/providers/weather/forecast";

function formatTick(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short" });
}

export function ForecastCard({ forecast }: { forecast: WeatherForecast }) {
  const hasData = forecast.days.length > 0;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Temperature forecast</CardTitle>
          <CardDescription>{forecast.days.length}-day outlook from {forecast.source}</CardDescription>
        </div>
        <Badge variant={forecast.isDemoData ? "neutral" : "brand"}>{forecast.isDemoData ? "Demo data" : "Live data"}</Badge>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border text-sm text-foreground-muted">
            Forecast unavailable right now.
          </div>
        ) : (
          <div className="h-32 w-full" role="img" aria-label="Line chart of forecast high and low temperatures">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast.days} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tickFormatter={formatTick} stroke="var(--foreground-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--foreground-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  labelFormatter={(label) => (typeof label === "string" ? formatTick(label) : String(label ?? ""))}
                  formatter={(value, name) => [`${value}°C`, name === "tempMaxC" ? "High" : "Low"]}
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="tempMaxC" stroke="var(--risk-elevated)" strokeWidth={2} dot={false} isAnimationActive animationDuration={700} />
                <Line type="monotone" dataKey="tempMinC" stroke="var(--brand)" strokeWidth={2} dot={false} isAnimationActive animationDuration={700} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="mt-2 text-xs text-foreground-muted">
          AQI forecast isn&apos;t available from the current provider — showing temperature only.
        </p>
      </CardContent>
    </Card>
  );
}
