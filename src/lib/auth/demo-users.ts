import bcrypt from "bcryptjs";

export type DemoRole = "USER" | "GOVERNMENT" | "ADMIN";

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: DemoRole;
}

/**
 * In-memory demo accounts, used ONLY when no real database is configured
 * (see isDatabaseConfigured). These are clearly-labeled fixtures for local
 * evaluation — never presented as a real authenticated backend.
 */
const DEMO_CREDENTIALS: Array<Pick<DemoUser, "id" | "name" | "email" | "role"> & { password: string }> = [
  { id: "demo-user-1", name: "Demo Citizen", email: "demo@climateguardian.ai", password: "demo1234", role: "USER" },
  {
    id: "demo-gov-1",
    name: "Demo Government Analyst",
    email: "gov@climateguardian.ai",
    password: "demo1234",
    role: "GOVERNMENT",
  },
  {
    id: "demo-admin-1",
    name: "Demo Admin",
    email: "admin@climateguardian.ai",
    password: "demo1234",
    role: "ADMIN",
  },
];

let cache: DemoUser[] | null = null;

function getDemoUsers(): DemoUser[] {
  if (!cache) {
    cache = DEMO_CREDENTIALS.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      role: c.role,
      passwordHash: bcrypt.hashSync(c.password, 10),
    }));
  }
  return cache;
}

export function findDemoUserByEmail(email: string): DemoUser | undefined {
  return getDemoUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function listDemoLoginHints(): Array<{ email: string; password: string; role: DemoRole }> {
  return DEMO_CREDENTIALS.map((c) => ({ email: c.email, password: c.password, role: c.role }));
}
