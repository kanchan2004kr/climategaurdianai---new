import { calculateAirRisk } from "@/lib/services/risk-engine";
import { calculateHeatRisk, type HeatRiskResult } from "@/lib/services/heat-risk";
import { calculateWaterRisk } from "@/lib/services/water-risk";
import { calculateDiseaseEnvironmentalRisk, type DiseaseEnvironmentalRisk } from "@/lib/services/disease-risk";
import { calculateDisasterRisk, type DisasterRiskResult } from "@/lib/services/disaster-risk";
import type { RiskResult } from "@/lib/types/risk";
import { getEnvironmentSnapshot, getWaterRiskInputs, getRiskTrend, type TrendPoint } from "./environment-snapshot";
import type { LocationOption } from "./locations";
import type { WeatherData, AirQualityData } from "@/lib/types/environment";

interface BaseDetail {
  location: LocationOption;
  availableLocations: LocationOption[];
  weather: WeatherData;
  air: AirQualityData;
  trend: TrendPoint[];
}

export interface AirRiskDetail extends BaseDetail {
  risk: RiskResult;
}

export async function getAirRiskDetail(userId: string, requestedLocationId?: string): Promise<AirRiskDetail> {
  const snapshot = await getEnvironmentSnapshot(userId, requestedLocationId);
  const risk = calculateAirRisk(snapshot.air, snapshot.weather, snapshot.vulnerability);
  const trend = await getRiskTrend(snapshot.location.id, "AIR");
  return { ...snapshot, risk, trend };
}

export interface HeatRiskDetail extends BaseDetail {
  risk: HeatRiskResult;
}

export async function getHeatRiskDetail(userId: string, requestedLocationId?: string): Promise<HeatRiskDetail> {
  const snapshot = await getEnvironmentSnapshot(userId, requestedLocationId);
  const risk = calculateHeatRisk(snapshot.weather, new Date(), snapshot.vulnerability);
  const trend = await getRiskTrend(snapshot.location.id, "HEAT");
  return { ...snapshot, risk, trend };
}

export interface WaterRiskDetail extends BaseDetail {
  risk: RiskResult;
  reportCounts: { contamination: number; noWater: number; flooding: number };
  operationalWaterPointRatio: number | null;
}

export async function getWaterRiskDetail(userId: string, requestedLocationId?: string): Promise<WaterRiskDetail> {
  const snapshot = await getEnvironmentSnapshot(userId, requestedLocationId);
  const inputs = await getWaterRiskInputs(snapshot.location.id, snapshot.location.city);
  const risk = calculateWaterRisk(
    { recentRainfallMm: snapshot.weather.rainfallMm ?? 0, rainfallLookbackDays: 1, ...inputs },
    snapshot.weather.isDemoData
  );
  const trend = await getRiskTrend(snapshot.location.id, "WATER");
  return {
    ...snapshot,
    risk,
    trend,
    reportCounts: {
      contamination: inputs.activeContaminationReports,
      noWater: inputs.activeNoWaterReports,
      flooding: inputs.activeFloodingReports,
    },
    operationalWaterPointRatio: inputs.operationalWaterPointRatio,
  };
}

export interface DiseaseRiskDetail extends BaseDetail {
  risk: DiseaseEnvironmentalRisk;
}

export async function getDiseaseRiskDetail(userId: string, requestedLocationId?: string): Promise<DiseaseRiskDetail> {
  const snapshot = await getEnvironmentSnapshot(userId, requestedLocationId);
  const risk = calculateDiseaseEnvironmentalRisk(
    {
      temperature: snapshot.weather.temperature,
      humidity: snapshot.weather.humidity,
      rainfallMm: snapshot.weather.rainfallMm ?? 0,
    },
    snapshot.weather.isDemoData
  );
  const trend = await getRiskTrend(snapshot.location.id, "DISEASE");
  return { ...snapshot, risk, trend };
}

export interface DisasterRiskDetail extends BaseDetail {
  risk: DisasterRiskResult;
}

export async function getDisasterRiskDetail(userId: string, requestedLocationId?: string): Promise<DisasterRiskDetail> {
  const snapshot = await getEnvironmentSnapshot(userId, requestedLocationId);
  const risk = calculateDisasterRisk(
    {
      temperature: snapshot.weather.temperature,
      humidity: snapshot.weather.humidity,
      windSpeed: snapshot.weather.windSpeed,
      precipitation: snapshot.weather.precipitation,
      rainfallMm: snapshot.weather.rainfallMm ?? 0,
    },
    snapshot.weather.isDemoData
  );
  const trend = await getRiskTrend(snapshot.location.id, "DISASTER");
  return { ...snapshot, risk, trend };
}
