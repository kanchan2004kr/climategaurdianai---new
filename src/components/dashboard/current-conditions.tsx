import { Thermometer, Droplets, Wind, Sun, Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { formatRelativeMinutes } from "@/lib/utils/time";
import type { AirQualityData, WeatherData } from "@/lib/types/environment";

function ConditionTile({
  icon: Icon,
  label,
  value,
  unit,
  decimals = 0,
}: {
  icon: typeof Thermometer;
  label: string;
  value: number | null;
  unit: string;
  decimals?: number;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface-muted/50 p-3">
      <div className="flex items-center gap-1.5 text-xs text-foreground-muted">
        <Icon className="size-3.5" />
        {label}
      </div>
      {value == null ? (
        <span className="text-sm text-foreground-muted">No data</span>
      ) : (
        <AnimatedNumber value={value} decimals={decimals} suffix={unit} className="tabular text-xl font-semibold text-foreground" />
      )}
    </div>
  );
}

export function CurrentConditions({ weather, air }: { weather: WeatherData; air: AirQualityData }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Current conditions</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={weather.isDemoData ? "neutral" : "brand"}>Weather: {weather.isDemoData ? "Demo" : "Live"}</Badge>
          <Badge variant={air.isDemoData ? "neutral" : "brand"}>Air: {air.isDemoData ? "Demo" : "Live"}</Badge>
          <span className="text-xs text-foreground-muted">{formatRelativeMinutes(weather.recordedAt)}</span>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <ConditionTile icon={Gauge} label="AQI" value={air.aqi} unit="" />
        <ConditionTile icon={Thermometer} label="Temperature" value={weather.temperature} unit="°C" decimals={1} />
        <ConditionTile icon={Droplets} label="Humidity" value={weather.humidity} unit="%" />
        <ConditionTile icon={Wind} label="Wind" value={weather.windSpeed} unit=" km/h" decimals={1} />
        <ConditionTile icon={Sun} label="UV Index" value={weather.uvIndex} unit="" decimals={1} />
      </CardContent>
      <CardContent className="pt-0 text-xs text-foreground-muted">
        Weather: {weather.source} · Air quality: {air.source}
      </CardContent>
    </Card>
  );
}
