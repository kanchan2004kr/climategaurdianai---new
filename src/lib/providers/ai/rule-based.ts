import type { AIPromptContext, AIProvider, AIResponse } from "./types";

const HEALTH_DISCLAIMER =
  "This is general environmental guidance, not medical advice. Consult a healthcare professional for personal health decisions.";

/** Deterministic fallback used when Gemini is unavailable — keeps the assistant functional offline. */
export class RuleBasedProvider implements AIProvider {
  readonly name = "Rule-Based Fallback";

  async generate(context: AIPromptContext): Promise<AIResponse> {
    const data = context.structuredData as Record<string, unknown>;
    const overall = (data.overallRisk as { level?: string; score?: number } | undefined) ?? {};
    const air = (data.airRisk as { level?: string } | undefined) ?? {};
    const heat = (data.heatRisk as { level?: string } | undefined) ?? {};

    const lines: string[] = [];
    lines.push(
      `Based on the current data for your location, overall climate risk is ${
        overall.level ?? "unavailable"
      } (score ${overall.score ?? "N/A"}/100).`
    );
    if (air.level) lines.push(`Air quality risk is ${air.level}.`);
    if (heat.level) lines.push(`Heat risk is ${heat.level}.`);

    if (["HIGH", "EXTREME"].includes(String(air.level))) {
      lines.push("Consider limiting prolonged outdoor exertion and using a mask outdoors if sensitive.");
    } else if (["HIGH", "EXTREME"].includes(String(heat.level))) {
      lines.push("Stay hydrated, avoid peak-sun hours, and take breaks in shade or cooled spaces.");
    } else {
      lines.push("Conditions look reasonable for typical outdoor activity — stay aware of changes through the day.");
    }

    return {
      content: lines.join(" "),
      isFallback: true,
      disclaimer: HEALTH_DISCLAIMER,
      provider: "rule-based",
    };
  }
}
