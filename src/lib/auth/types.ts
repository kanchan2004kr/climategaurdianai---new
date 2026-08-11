import type { DefaultSession } from "next-auth";

export type AppRole = "USER" | "GOVERNMENT" | "ADMIN";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: AppRole;
      isDemoAccount?: boolean;
    };
  }

  interface User {
    role?: AppRole;
    isDemoAccount?: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: AppRole;
    isDemoAccount?: boolean;
  }
}
