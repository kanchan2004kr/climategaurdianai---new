import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { isDatabaseConfigured } from "@/lib/db/status";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  const isDemoMode = !isDatabaseConfigured();

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to view your personalized climate risk dashboard.">
      <Suspense>
        <LoginForm isDemoMode={isDemoMode} />
      </Suspense>
    </AuthShell>
  );
}
