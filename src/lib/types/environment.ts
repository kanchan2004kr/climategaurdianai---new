export interface WeatherData {
  temperature: number; // Celsius
  humidity: number; // %
  windSpeed: number; // km/h
  precipitation: number; // mm (current)
  uvIndex: number | null;
  rainfallMm: number | null; // recent accumulated rainfall
  source: string;
  isDemoData: boolean;
  recordedAt: string;
}

export interface AirQualityData {
  aqi: number;
  pm25: number;
  pm10: number | null;
  o3: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
  source: string;
  isDemoData: boolean;
  recordedAt: string;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface ResolvedLocation extends GeoPoint {
  id?: string;
  name: string;
  city?: string;
  region?: string;
  country?: string;
}
