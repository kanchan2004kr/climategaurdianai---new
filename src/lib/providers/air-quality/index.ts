import type { AirQualityData, GeoPoint } from "@/lib/types/environment";
import { OpenAQProvider } from "./openaq";
import { DemoAirQualityProvider } from "./demo";
import type { AirQualityProvider } from "./types";

const live = new OpenAQProvider();
const demo = new DemoAirQualityProvider();

export async function getAirQuality(point: GeoPoint): Promise<AirQualityData> {
  try {
    return await live.getCurrentAirQuality(point);
  } catch {
    return demo.getCurrentAirQuality(point);
  }
}

export type { AirQualityProvider };
export { OpenAQProvider, DemoAirQualityProvider };
