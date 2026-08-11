import type { GeoPoint, WeatherData } from "@/lib/types/environment";
import type { WeatherProvider } from "./types";

const BASE_URL = process.env.OPEN_METEO_BASE_URL ?? "https://api.open-meteo.com/v1";

export class OpenMeteoProvider implements WeatherProvider {
  readonly name = "Open-Meteo";

  async getCurrentWeather(point: GeoPoint): Promise<WeatherData> {
    const url = new URL(`${BASE_URL}/forecast`);
    url.searchParams.set("latitude", String(point.latitude));
    url.searchParams.set("longitude", String(point.longitude));
    url.searchParams.set(
      "current",
      "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,uv_index"
    );
    url.searchParams.set("daily", "precipitation_sum");
    url.searchParams.set("timezone", "auto");

    const res = await fetch(url.toString(), {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      throw new Error(`Open-Meteo request failed: ${res.status}`);
    }
    const json = await res.json();
    const current = json.current ?? {};
    const rainfallToday: number | null = json.daily?.precipitation_sum?.[0] ?? null;

    return {
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      precipitation: current.precipitation ?? 0,
      uvIndex: current.uv_index ?? null,
      rainfallMm: rainfallToday,
      source: this.name,
      isDemoData: false,
      recordedAt: current.time ?? new Date().toISOString(),
    };
  }
}
