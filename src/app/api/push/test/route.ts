import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isPushConfigured, sendPushToUser } from "@/lib/push/web-push";

/** Sends a test notification to the current user's devices, so they can confirm push works. */
export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isPushConfigured()) return NextResponse.json({ error: "Push is not configured on the server." }, { status: 503 });

  await sendPushToUser(session.user.id, {
    title: "ClimateGuardian AI",
    body: "Notifications are working — you'll be alerted here about high climate risk.",
    url: "/alerts",
    tag: "test-notification",
  });

  return NextResponse.json({ ok: true });
}
