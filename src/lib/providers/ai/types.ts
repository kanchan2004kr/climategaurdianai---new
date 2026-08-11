export interface AIPromptContext {
  systemPrompt: string;
  userMessage: string;
  structuredData: Record<string, unknown>;
}

export interface AIResponse {
  content: string;
  isFallback: boolean;
  disclaimer?: string;
  /** Internal tracking only — never exposed as a secret, just which provider actually served this response. */
  provider?: "openrouter" | "gemini" | "rule-based";
}

export interface AIProvider {
  readonly name: string;
  generate(context: AIPromptContext): Promise<AIResponse>;
}
