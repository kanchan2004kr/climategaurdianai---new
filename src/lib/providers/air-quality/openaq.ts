import type { AirQualityData, GeoPoint } from "@/lib/types/environment";
import type { AirQualityProvider } from "./types";

const BASE_URL = process.env.OPENAQ_BASE_URL ?? "https://api.openaq.org/v3";

/** Readings older than this are treated as unavailable rather than presented as "live now". */
const MAX_READING_AGE_MS = 72 * 60 * 60 * 1000;

interface Sensor {
  id: number;
  parameter?: { name?: string };
}

export class OpenAQProvider implements AirQualityProvider {
  readonly name = "OpenAQ";

  async getCurrentAirQuality(point: GeoPoint): Promise<AirQualityData> {
    const apiKey = process.env.OPENAQ_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAQ_API_KEY not configured");
    }

    const locationsUrl = new URL(`${BASE_URL}/locations`);
    locationsUrl.searchParams.set("coordinates", `${point.latitude},${point.longitude}`);
    locationsUrl.searchParams.set("radius", "25000");
    locationsUrl.searchParams.set("limit", "1");

    const res = await fetch(locationsUrl.toString(), {
      headers: { "X-API-Key": apiKey },
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`OpenAQ request failed: ${res.status}`);

    const json = await res.json();
    const stationId = json.results?.[0]?.id;
    if (!stationId) throw new Error("No OpenAQ station nearby");

    // The /latest endpoint identifies readings by sensorsId, not parameter
    // name — fetch the station detail to map sensor -> parameter name.
    const stationRes = await fetch(`${BASE_URL}/locations/${stationId}`, {
      headers: { "X-API-Key": apiKey },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!stationRes.ok) throw new Error(`OpenAQ station detail request failed: ${stationRes.status}`);
    const stationJson = await stationRes.json();
    const sensors: Sensor[] = stationJson.results?.[0]?.sensors ?? [];
    const parameterBySensorId = new Map<number, string>();
    for (const sensor of sensors) {
      const paramName = sensor.parameter?.name?.toLowerCase();
      if (paramName) parameterBySensorId.set(sensor.id, paramName);
    }

    const latestUrl = new URL(`${BASE_URL}/locations/${stationId}/latest`);
    const latestRes = await fetch(latestUrl.toString(), {
      headers: { "X-API-Key": apiKey },
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(5000),
    });
    if (!latestRes.ok) throw new Error(`OpenAQ latest request failed: ${latestRes.status}`);
    const latestJson = await latestRes.json();

    const readings: Record<string, number> = {};
    let mostRecentUtc: string | null = null;
    for (const r of latestJson.results ?? []) {
      const param = parameterBySensorId.get(r.sensorsId);
      if (param && typeof r.value === "number") {
        readings[param] = r.value;
      }
      const utc = r.datetime?.utc;
      if (utc && (!mostRecentUtc || utc > mostRecentUtc)) mostRecentUtc = utc;
    }

    if (readings["pm25"] == null) {
      throw new Error("No PM2.5 reading available from nearest OpenAQ station");
    }

    if (!mostRecentUtc || Date.now() - new Date(mostRecentUtc).getTime() > MAX_READING_AGE_MS) {
      throw new Error("Nearest OpenAQ station has no recent readings");
    }

    const pm25 = readings["pm25"];
    const aqi = pm25ToAqi(pm25);

    return {
      aqi,
      pm25,
      pm10: readings["pm10"] ?? null,
      o3: readings["o3"] ?? null,
      no2: readings["no2"] ?? null,
      so2: readings["so2"] ?? null,
      co: readings["co"] ?? null,
      source: this.name,
      isDemoData: false,
      recordedAt: mostRecentUtc,
    };
  }
}

/** US EPA-style linear breakpoint conversion, PM2.5 (µg/m³) -> AQI. */
function pm25ToAqi(pm25: number): number {
  const breakpoints = [
    { cLow: 0, cHigh: 12, iLow: 0, iHigh: 50 },
    { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
    { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
    { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500 },
  ];
  const bp = breakpoints.find((b) => pm25 >= b.cLow && pm25 <= b.cHigh) ?? breakpoints[breakpoints.length - 1];
  return Math.round(
    ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.iLow
  );
}
