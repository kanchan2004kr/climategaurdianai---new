import type { GeoPoint, WeatherData } from "@/lib/types/environment";

export interface WeatherProvider {
  readonly name: string;
  getCurrentWeather(point: GeoPoint): Promise<WeatherData>;
}
