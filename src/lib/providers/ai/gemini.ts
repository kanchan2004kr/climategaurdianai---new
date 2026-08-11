import type { AIPromptContext, AIProvider, AIResponse } from "./types";

// gemini-2.0-flash and gemini-2.5-flash were both retired for this project;
// gemini-flash-latest is Google's maintained alias for the current stable
// flash model, so it survives future model churn without code changes.
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

// Keep the AI off the critical path: if Gemini hasn't answered within this
// window we abort and let the fallback chain (OpenRouter -> rule-based) take
// over, rather than letting a hanging request block the whole page. Dashboard
// briefs are streamed via <Suspense>, so this can be generous without blocking
// the visible page; it only bounds the worst case.
const REQUEST_TIMEOUT_MS = 12000;

export class GeminiProvider implements AIProvider {
  readonly name = "Gemini";

  async generate(context: AIPromptContext): Promise<AIResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

    const prompt = `${context.systemPrompt}\n\nStructured environmental data:\n${JSON.stringify(
      context.structuredData,
      null,
      2
    )}\n\nUser question: ${context.userMessage}`;

    let res: Response;
    try {
      res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          // This model spends part of its token budget on internal reasoning
          // before the visible answer, so 500 tokens was too small and always
          // truncated to empty content — 2048 leaves room for both.
          generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) {
        throw new Error("Gemini request timed out");
      }
      throw err;
    }

    if (!res.ok) throw new Error(`Gemini request failed: ${res.status}`);

    const json = await res.json();
    const content: string | undefined = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error("Gemini returned no content");

    return { content, isFallback: false, provider: "gemini" };
  }
}
