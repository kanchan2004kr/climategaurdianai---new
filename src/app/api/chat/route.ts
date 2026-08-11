import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateAIResponse } from "@/lib/providers/ai";
import { chatMessageCreateSchema } from "@/lib/schemas/chat";
import { getChatContext } from "@/lib/services/chat/get-chat-context";

const SYSTEM_PROMPT =
  "You are ClimateGPT, ClimateGuardian AI's assistant. You explain the user's already-computed climate and health " +
  "risk data — you never invent weather, air quality, or risk figures. If a category has no stored data, say so " +
  "plainly rather than guessing. Never diagnose disease, never prescribe medication, never claim certainty. This is " +
  "guidance, not medical advice.";

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
    structuredData: { location: context.locationName, risk: context.risk },
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
