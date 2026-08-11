import type { GeoPoint } from "@/lib/types/environment";

export interface ForecastDay {
  date: string; // ISO date, no time component
  tempMaxC: number;
  tempMinC: number;
}

export interface WeatherForecast {
  days: ForecastDay[];
  source: string;
  isDemoData: boolean;
}

const BASE_URL = process.env.OPEN_METEO_BASE_URL ?? "https://api.open-meteo.com/v1";
const FORECAST_DAYS = 3;

async function getLiveForecast(point: GeoPoint): Promise<WeatherForecast> {
  const url = new URL(`${BASE_URL}/forecast`);
  url.searchParams.set("latitude", String(point.latitude));
  url.searchParams.set("longitude", String(point.longitude));
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min");
  url.searchParams.set("forecast_days", String(FORECAST_DAYS));
  url.searchParams.set("timezone", "auto");

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Open-Meteo forecast request failed: ${res.status}`);

  const json = await res.json();
  const dates: string[] | undefined = json.daily?.time;
  const max: number[] | undefined = json.daily?.temperature_2m_max;
  const min: number[] | undefined = json.daily?.temperature_2m_min;

  if (!dates || !max || !min) throw new Error("Open-Meteo forecast response missing daily data");

  return {
    days: dates.map((date, i) => ({ date, tempMaxC: max[i], tempMinC: min[i] })),
    source: "Open-Meteo",
    isDemoData: false,
  };
}

/** Deterministic, clearly-labeled fallback used when the live forecast is unavailable. */
function getDemoForecast(point: GeoPoint): WeatherForecast {
  const seed = Math.abs(Math.round((point.latitude + point.longitude) * 100)) % 10;
  const today = new Date();

  const days: ForecastDay[] = Array.from({ length: FORECAST_DAYS }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return {
      date: date.toISOString().slice(0, 10),
      tempMaxC: 30 + seed * 0.5 + i * 0.4,
      tempMinC: 22 + seed * 0.3 + i * 0.2,
    };
  });

  return { days, source: "Demo Data", isDemoData: true };
}

/** Resolves a short-term temperature forecast with a live-provider-first, demo-fallback strategy. Never throws. */
export async function getWeatherForecast(point: GeoPoint): Promise<WeatherForecast> {
  try {
    return await getLiveForecast(point);
  } catch {
    return getDemoForecast(point);
  }
}
