import type { RiskLevel } from "@/lib/types/risk";

const elevatedOrAbove = (level: RiskLevel) => level === "ELEVATED" || level === "HIGH" || level === "EXTREME";
const highOrAbove = (level: RiskLevel) => level === "HIGH" || level === "EXTREME";

/** Deterministic, level-based precautions — general environmental guidance, not medical advice. */
export function airPrecautions(level: RiskLevel): string[] {
  if (highOrAbove(level)) {
    return [
      "Avoid intense outdoor exercise",
      "Wear a suitable protective mask outdoors if sensitive",
      "Prefer indoor activity during peak pollution hours",
    ];
  }
  if (elevatedOrAbove(level)) {
    return ["Reduce prolonged outdoor exposure", "Prefer lower-traffic routes when outdoors"];
  }
  return ["Conditions are reasonable for typical outdoor activity"];
}

export function heatPrecautions(level: RiskLevel): string[] {
  if (highOrAbove(level)) {
    return [
      "Avoid outdoor activity during peak heat hours",
      "Stay hydrated and take breaks in shade or cooled spaces",
      "Watch for signs of heat exhaustion",
    ];
  }
  if (elevatedOrAbove(level)) {
    return ["Stay hydrated", "Limit strenuous activity during the hottest part of the day"];
  }
  return ["Conditions are reasonable — stay hydrated as usual"];
}

export function waterPrecautions(level: RiskLevel): string[] {
  if (highOrAbove(level)) {
    return [
      "Avoid contact with visibly contaminated or flood water",
      "Use stored or treated water where contamination is reported",
      "Report water issues you observe to help others",
    ];
  }
  if (elevatedOrAbove(level)) {
    return ["Monitor local water advisories", "Check water quality before use if reports exist nearby"];
  }
  return ["No unusual water precautions needed right now"];
}
