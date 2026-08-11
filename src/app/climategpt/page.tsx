import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ClimateGptChat } from "@/components/chat/climate-gpt-chat";

export const metadata: Metadata = { title: "ClimateGPT" };

export default async function ClimateGptPage() {
  const session = await auth();
  if (!session?.user) return null;

  const chatSession = await prisma.chatSession.findFirst({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  const initialMessages =
    chatSession?.messages.map((m) => {
      const contextData = m.contextData as { isFallback?: boolean } | null;
      return {
        id: m.id,
        role: m.role,
        content: m.content,
        isFallback: contextData?.isFallback,
      };
    }) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">ClimateGPT</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Ask questions about your current climate and health risk. Answers are generated from your real, already
          computed data — Gemini primary, OpenRouter fallback, rule-based as a last resort.
        </p>
      </div>

      <ClimateGptChat initialSessionId={chatSession?.id ?? null} initialMessages={initialMessages} />
    </div>
  );
}
