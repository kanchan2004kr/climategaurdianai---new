import type { AIPromptContext, AIResponse } from "./types";
import { GeminiProvider } from "./gemini";
import { OpenRouterProvider } from "./openrouter";
import { RuleBasedProvider } from "./rule-based";

const primary = new GeminiProvider();
const secondary = new OpenRouterProvider();
const fallback = new RuleBasedProvider();

/** Fallback chain: Gemini -> OpenRouter -> rule-based. The risk engine remains the sole source of truth for scores; every provider here only explains already-computed values. */
export async function generateAIResponse(context: AIPromptContext): Promise<AIResponse> {
  try {
    return await primary.generate(context);
  } catch {
    try {
      return await secondary.generate(context);
    } catch {
      return fallback.generate(context);
    }
  }
}

export type { AIProvider, AIPromptContext, AIResponse } from "./types";
export { GeminiProvider, OpenRouterProvider, RuleBasedProvider };
