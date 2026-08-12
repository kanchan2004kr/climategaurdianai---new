import type { AIPromptContext, AIProvider, AIResponse } from "./types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// Bounded so the (streamed, off-critical-path) AI brief can't hang: if OpenRouter
// stalls we abort and fall through to the rule-based provider instead of waiting.
const REQUEST_TIMEOUT_MS = 8000;

/** OpenRouter — primary AI provider. Only explains existing risk-engine output; never asked to compute scores itself. */
export class OpenRouterProvider implements AIProvider {
  readonly name = "OpenRouter";

  async generate(context: AIPromptContext): Promise<AIResponse> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

    const model = process.env.OPENROUTER_MODEL || "openai/gpt-oss-20b:free";

    const userContent = `Structured environmental data:\n${JSON.stringify(
      context.structuredData,
      null,
      2
    )}\n\nUser question: ${context.userMessage}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "ClimateGuardian AI",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: context.systemPrompt },
            { role: "user", content: userContent },
          ],
          temperature: 0.4,
          max_tokens: 500,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("OpenRouter request timed out");
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    if (res.status === 401 || res.status === 403) throw new Error(`OpenRouter auth failed: ${res.status}`);
    if (res.status === 429) throw new Error("OpenRouter rate limit exceeded");
    if (!res.ok) throw new Error(`OpenRouter request failed: ${res.status}`);

    const json = await res.json().catch(() => null);
    const content: string | undefined = json?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      throw new Error("OpenRouter returned no usable content");
    }

    return { content: content.trim(), isFallback: false, provider: "openrouter" };
  }
}
