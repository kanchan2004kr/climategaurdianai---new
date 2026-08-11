import type { GeoPoint, WeatherData } from "@/lib/types/environment";
import type { WeatherProvider } from "./types";

/** Deterministic, clearly-labeled fallback data used when live providers are unavailable. */
export class DemoWeatherProvider implements WeatherProvider {
  readonly name = "Demo Data";

  async getCurrentWeather(point: GeoPoint): Promise<WeatherData> {
    const seed = Math.abs(Math.round((point.latitude + point.longitude) * 100)) % 10;
    return {
      temperature: 28 + seed * 0.6,
      humidity: 55 + seed,
      windSpeed: 10 + seed * 0.4,
      precipitation: seed % 4 === 0 ? 2.5 : 0,
      uvIndex: 6 + (seed % 5),
      rainfallMm: seed % 3 === 0 ? 12 : 0,
      source: this.name,
      isDemoData: true,
      recordedAt: new Date().toISOString(),
    };
  }
}
