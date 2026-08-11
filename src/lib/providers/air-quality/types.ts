import type { AirQualityData, GeoPoint } from "@/lib/types/environment";

export interface AirQualityProvider {
  readonly name: string;
  getCurrentAirQuality(point: GeoPoint): Promise<AirQualityData>;
}
