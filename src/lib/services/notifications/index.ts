import type { RiskLevel } from "@/lib/types/risk";

export type AlertType =
  | "HIGH_AQI"
  | "HIGH_HEAT"
  | "HEAVY_RAIN"
  | "FLOOD_RISK"
  | "WATER_ALERT"
  | "DISEASE_RISK"
  | "WILDFIRE_RISK"
  | "CYCLONE_RISK";

export type AlertSeverity = "INFO" | "WARNING" | "SEVERE" | "EXTREME";

export interface AlertCandidate {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
}

export interface NotificationPreferences {
  notifyAqi: boolean;
  notifyHeat: boolean;
  notifyRain: boolean;
  notifyFlood: boolean;
  notifyWater: boolean;
}

const ALERT_TYPE_TO_PREFERENCE: Record<AlertType, keyof NotificationPreferences> = {
  HIGH_AQI: "notifyAqi",
  HIGH_HEAT: "notifyHeat",
  HEAVY_RAIN: "notifyRain",
  FLOOD_RISK: "notifyFlood",
  WATER_ALERT: "notifyWater",
  DISEASE_RISK: "notifyAqi",
  WILDFIRE_RISK: "notifyFlood",
  CYCLONE_RISK: "notifyFlood",
};

function severityForLevel(level: RiskLevel): AlertSeverity {
  switch (level) {
    case "EXTREME":
      return "EXTREME";
    case "HIGH":
      return "SEVERE";
    case "ELEVATED":
      return "WARNING";
    default:
      return "INFO";
  }
}

/** Rule-based alert generation from category risk scores; threshold: ELEVATED and above. */
export function generateAlertCandidates(scores: {
  airLevel: RiskLevel;
  heatLevel: RiskLevel;
  waterLevel: RiskLevel;
  floodScore: number;
  wildfireScore: number;
  cycloneScore: number;
  diseaseMaxLevel: RiskLevel;
}): AlertCandidate[] {
  const candidates: AlertCandidate[] = [];
  const isElevatedOrAbove = (level: RiskLevel) =>
    level === "ELEVATED" || level === "HIGH" || level === "EXTREME";

  if (isElevatedOrAbove(scores.airLevel)) {
    candidates.push({
      type: "HIGH_AQI",
      severity: severityForLevel(scores.airLevel),
      title: "Elevated Air Quality Risk",
      message: "Air quality in your area may affect sensitive groups. Consider limiting prolonged outdoor exposure.",
    });
  }

  if (isElevatedOrAbove(scores.heatLevel)) {
    candidates.push({
      type: "HIGH_HEAT",
      severity: severityForLevel(scores.heatLevel),
      title: "Elevated Heat Risk",
      message: "High heat conditions detected. Stay hydrated and avoid peak-hour outdoor activity.",
    });
  }

  if (isElevatedOrAbove(scores.waterLevel)) {
    candidates.push({
      type: "WATER_ALERT",
      severity: severityForLevel(scores.waterLevel),
      title: "Water Risk Advisory",
      message: "Water availability or quality concerns reported in your area.",
    });
  }

  if (scores.floodScore >= 41) {
    candidates.push({
      type: "FLOOD_RISK",
      severity: severityForLevel(scoreLevel(scores.floodScore)),
      title: "Flood Risk Advisory (Modelled)",
      message: "Modelled flood risk is elevated based on rainfall trends. This is not an official government alert.",
    });
  }

  if (scores.wildfireScore >= 41) {
    candidates.push({
      type: "WILDFIRE_RISK",
      severity: severityForLevel(scoreLevel(scores.wildfireScore)),
      title: "Wildfire Risk Advisory (Modelled)",
      message: "Hot, dry conditions increase wildfire risk in your region.",
    });
  }

  if (scores.cycloneScore >= 41) {
    candidates.push({
      type: "CYCLONE_RISK",
      severity: severityForLevel(scoreLevel(scores.cycloneScore)),
      title: "Cyclone Risk Advisory (Modelled)",
      message: "Wind conditions suggest elevated cyclone-related risk. Follow official guidance for confirmed alerts.",
    });
  }

  if (isElevatedOrAbove(scores.diseaseMaxLevel)) {
    candidates.push({
      type: "DISEASE_RISK",
      severity: severityForLevel(scores.diseaseMaxLevel),
      title: "Climate-Sensitive Disease Environmental Risk",
      message: "Environmental conditions are more suitable for vector breeding. This is not a case forecast or diagnosis.",
    });
  }

  return candidates;
}

function scoreLevel(score: number): RiskLevel {
  if (score <= 20) return "LOW";
  if (score <= 40) return "MODERATE";
  if (score <= 60) return "ELEVATED";
  if (score <= 80) return "HIGH";
  return "EXTREME";
}

export function filterByPreferences(
  candidates: AlertCandidate[],
  preferences: NotificationPreferences
): AlertCandidate[] {
  return candidates.filter((c) => preferences[ALERT_TYPE_TO_PREFERENCE[c.type]]);
}
