import type { AirQualityData, GeoPoint } from "@/lib/types/environment";
import type { AirQualityProvider } from "./types";

export class DemoAirQualityProvider implements AirQualityProvider {
  readonly name = "Demo Data";

  async getCurrentAirQuality(point: GeoPoint): Promise<AirQualityData> {
    const seed = Math.abs(Math.round((point.latitude + point.longitude) * 100)) % 10;
    const pm25 = 40 + seed * 8;
    return {
      aqi: Math.round(pm25 * 1.5),
      pm25,
      pm10: pm25 * 1.6,
      o3: 30 + seed,
      no2: 20 + seed,
      so2: 8 + seed * 0.5,
      co: 0.5 + seed * 0.05,
      source: this.name,
      isDemoData: true,
      recordedAt: new Date().toISOString(),
    };
  }
}
