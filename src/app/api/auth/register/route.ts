import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/status";
import { registerSchema } from "@/lib/schemas/auth";
import { listDemoLoginHints } from "@/lib/auth/demo-users";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        error: "Registration unavailable in demo mode",
        message:
          "This deployment isn't connected to a live database yet, so new accounts can't be created. Sign in with one of the demo accounts below instead.",
        isDemoMode: true,
        demoAccounts: listDemoLoginHints(),
      },
      { status: 503 }
    );
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "USER",
        profile: { create: {} },
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        error: "Registration failed",
        message:
          "The database is unreachable right now. Sign in with one of the demo accounts below instead.",
        isDemoMode: true,
        demoAccounts: listDemoLoginHints(),
      },
      { status: 503 }
    );
  }
}
