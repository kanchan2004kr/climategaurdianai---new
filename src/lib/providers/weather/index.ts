import type { GeoPoint, WeatherData } from "@/lib/types/environment";
import type { WeatherProvider } from "./types";
import { OpenMeteoProvider } from "./open-meteo";
import { DemoWeatherProvider } from "./demo";

const live = new OpenMeteoProvider();
const demo = new DemoWeatherProvider();

/** Resolves weather with a live-provider-first, demo-data-fallback strategy. Never throws. */
export async function getWeather(point: GeoPoint): Promise<WeatherData> {
  try {
    return await live.getCurrentWeather(point);
  } catch {
    return demo.getCurrentWeather(point);
  }
}

export type { WeatherProvider };
export { OpenMeteoProvider, DemoWeatherProvider };
