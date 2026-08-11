"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const nameSchema = z.string().trim().min(1).max(80);

/** Updates the signed-in user's display name. Demo/unbacked accounts (no DB row) fail gracefully. */
export async function updateNameAction(name: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Not signed in." };

  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) return { ok: false, error: "Enter a name between 1 and 80 characters." };

  try {
    await prisma.user.update({ where: { id: session.user.id }, data: { name: parsed.data } });
    return { ok: true };
  } catch {
    return { ok: false, error: "This account's name can't be updated right now." };
  }
}
