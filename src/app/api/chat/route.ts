import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateAIResponse } from "@/lib/providers/ai";
import { chatMessageCreateSchema } from "@/lib/schemas/chat";
import { getChatContext } from "@/lib/services/chat/get-chat-context";

const SYSTEM_PROMPT = [
  "You are ClimateGPT, ClimateGuardian AI's assistant. You explain the user's already-computed climate and health risk data.",
  "",
  "Answer style — follow strictly:",
  "1. Answer the user's exact question first, directly.",
  "2. Keep normal answers to 2-5 short sentences. Be concise and direct.",
  "3. Use bullet points only when they genuinely help (e.g. a few precautions).",
  "4. Only cite numbers that appear in the provided context. Never invent weather, AQI, or risk figures.",
  "5. If a value is marked 'Data unavailable', say it's unavailable — do not guess.",
  "6. Do not repeat the entire dashboard or list every category unless asked.",
  "7. No generic climate lectures, no unrelated facts, no fabricated sources.",
  "8. Never diagnose disease or prescribe medication. For health questions give general safety guidance and recommend a professional where appropriate.",
  "",
  "Example — Q: 'What is my heat risk?' A: 'Your heat risk is Moderate at 21/100. Current temperature is the main contributor. Stay hydrated and avoid prolonged outdoor activity during peak heat.'",
].join("\n");

/** Most recent chat session for the user, with its messages, or null if they've never started one. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chatSession = await prisma.chatSession.findFirst({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json({ chatSession });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = chatMessageCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { chatSessionId, message, locationId } = parsed.data;

  // Always scoped to the authenticated user — never trust a session id belonging to someone else.
  let chatSession = chatSessionId
    ? await prisma.chatSession.findFirst({ where: { id: chatSessionId, userId: session.user.id } })
    : null;

  if (!chatSession) {
    chatSession = await prisma.chatSession.create({
      data: { userId: session.user.id, title: message.slice(0, 60) },
    });
  }

  let context;
  try {
    context = await getChatContext(session.user.id, locationId);
  } catch {
    return NextResponse.json({ error: "No location available to ground this conversation in." }, { status: 422 });
  }

  const userMessage = await prisma.chatMessage.create({
    data: { chatSessionId: chatSession.id, role: "USER", content: message },
  });

  const aiResponse = await generateAIResponse({
    systemPrompt: SYSTEM_PROMPT,
    userMessage: message,
    // Curated natural-language `context` (not a raw JSON dump) keeps the LLM
    // answers grounded and concise. The structured *Risk fields are also passed
    // so the deterministic rule-based fallback still has real values to report.
    structuredData: {
      context: context.summary,
      overallRisk: context.risk.OVERALL ?? undefined,
      airRisk: context.risk.AIR ?? undefined,
      heatRisk: context.risk.HEAT ?? undefined,
    },
  });

  const assistantMessage = await prisma.chatMessage.create({
    data: {
      chatSessionId: chatSession.id,
      role: "ASSISTANT",
      content: aiResponse.content,
      contextData: { location: context.locationName, risk: context.risk, isFallback: aiResponse.isFallback },
    },
  });

  await prisma.chatSession.update({ where: { id: chatSession.id }, data: { updatedAt: new Date() } });

  return NextResponse.json({
    chatSessionId: chatSession.id,
    userMessage: { id: userMessage.id, role: userMessage.role, content: userMessage.content, createdAt: userMessage.createdAt },
    assistantMessage: {
      id: assistantMessage.id,
      role: assistantMessage.role,
      content: assistantMessage.content,
      createdAt: assistantMessage.createdAt,
      isFallback: aiResponse.isFallback,
      disclaimer: aiResponse.disclaimer,
    },
  });
}
