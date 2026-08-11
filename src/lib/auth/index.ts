import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { isDatabaseConfigured } from "@/lib/db/status";
import { findDemoUserByEmail } from "./demo-users";
import { loginSchema } from "@/lib/schemas/auth";
import type { AppRole } from "./types";
import "./types";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        if (isDatabaseConfigured()) {
          try {
            const user = await prisma.user.findUnique({ where: { email } });
            if (user?.passwordHash && (await bcrypt.compare(password, user.passwordHash))) {
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role as AppRole,
                isDemoAccount: false,
              };
            }
            return null;
          } catch {
            // Database unreachable despite being configured — fall through to demo mode
            // rather than crash the login flow.
          }
        }

        const demoUser = findDemoUserByEmail(email);
        if (demoUser && bcrypt.compareSync(password, demoUser.passwordHash)) {
          return {
            id: demoUser.id,
            name: demoUser.name,
            email: demoUser.email,
            role: demoUser.role,
            isDemoAccount: true,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as AppRole;
        token.isDemoAccount = user.isDemoAccount;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role ?? "USER";
        session.user.isDemoAccount = token.isDemoAccount;
      }
      return session;
    },
  },
});
