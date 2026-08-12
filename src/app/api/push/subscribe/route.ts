import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isPushConfigured } from "@/lib/push/web-push";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPushConfigured()) return NextResponse.json({ error: "Push is not configured on the server." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const parsed = subscriptionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });

  const { endpoint, keys } = parsed.data;
  const userAgent = request.headers.get("user-agent") ?? undefined;

  // Upsert by endpoint so re-subscribing the same browser never duplicates rows,
  // and a subscription always belongs to the current authenticated user.
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: session.user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent },
    update: { userId: session.user.id, p256dh: keys.p256dh, auth: keys.auth, userAgent },
  });

  return NextResponse.json({ ok: true });
}
