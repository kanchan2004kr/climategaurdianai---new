"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";

interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  isFallback?: boolean;
  disclaimer?: string;
}

interface ClimateGptChatProps {
  initialSessionId: string | null;
  initialMessages: ChatMessage[];
}

export function ClimateGptChat({ initialSessionId, initialMessages }: ClimateGptChatProps) {
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError(null);
    setInput("");

    const optimisticUser: ChatMessage = { id: `pending-${Date.now()}`, role: "USER", content: trimmed };
    setMessages((prev) => [...prev, optimisticUser]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, chatSessionId: sessionId ?? undefined }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Something went wrong. Please try again.");
      }

      const data = await res.json();
      setSessionId(data.chatSessionId);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUser.id),
        { id: data.userMessage.id, role: "USER", content: data.userMessage.content },
        {
          id: data.assistantMessage.id,
          role: "ASSISTANT",
          content: data.assistantMessage.content,
          isFallback: data.assistantMessage.isFallback,
          disclaimer: data.assistantMessage.disclaimer,
        },
      ]);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
      setInput(trimmed);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <div ref={listRef} className="flex max-h-[520px] min-h-[240px] flex-col gap-3 overflow-y-auto p-1">
            {messages.length === 0 ? (
              <p className="p-4 text-center text-sm text-foreground-muted">
                Ask about your current climate risk, air quality, or what precautions to take. ClimateGPT explains
                your real data — it won&apos;t invent numbers it doesn&apos;t have.
              </p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={m.role === "USER" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={
                      m.role === "USER"
                        ? "max-w-[80%] rounded-lg bg-brand px-3 py-2 text-sm text-brand-foreground"
                        : "max-w-[80%] rounded-lg border border-border bg-surface-muted/50 px-3 py-2 text-sm text-foreground"
                    }
                  >
                    {m.role === "ASSISTANT" && (
                      <div className="mb-1 flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-brand" />
                        {m.isFallback ? (
                          <Badge variant="neutral">Rule-based fallback</Badge>
                        ) : (
                          <Badge variant="brand">AI summary</Badge>
                        )}
                      </div>
                    )}
                    <p>{m.content}</p>
                    {m.disclaimer && <p className="mt-2 text-xs text-foreground-muted">{m.disclaimer}</p>}
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-lg border border-border bg-surface-muted/50 px-3 py-2 text-sm text-foreground-muted" aria-live="polite">
                  Thinking…
                </div>
              </div>
            )}
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your climate risk…"
              disabled={sending}
              aria-label="Message"
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send message"
              className="flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
