"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerSchema, type RegisterInput } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

interface DemoModeResponse {
  message: string;
  demoAccounts: Array<{ email: string; password: string; role: string }>;
}

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [demoModeInfo, setDemoModeInfo] = useState<DemoModeResponse | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterInput) {
    setFormError(null);
    setDemoModeInfo(null);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = await response.json();

    if (response.status === 503 && data.isDemoMode) {
      setDemoModeInfo({ message: data.message, demoAccounts: data.demoAccounts });
      return;
    }

    if (!response.ok) {
      setFormError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    router.push("/login?registered=1");
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}
        {demoModeInfo && (
          <Alert variant="warning">
            <div>
              <p>{demoModeInfo.message}</p>
              <ul className="mt-2 space-y-0.5 text-xs">
                {demoModeInfo.demoAccounts.map((acct) => (
                  <li key={acct.email}>
                    <code>{acct.email}</code> / <code>{acct.password}</code> ({acct.role})
                  </li>
                ))}
              </ul>
            </div>
          </Alert>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" autoComplete="name" aria-invalid={Boolean(errors.name)} {...register("name")} />
          {errors.name && <p className="text-xs text-risk-high">{errors.name.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-risk-high">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-risk-high">{errors.password.message}</p>}
          <p className="text-xs text-foreground-muted">At least 8 characters.</p>
        </div>

        <Button type="submit" disabled={isSubmitting} className="mt-2">
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-foreground-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>

      <p className="text-center text-xs text-foreground-muted">
        By continuing you agree this platform provides environmental and public-health guidance only —
        it is not a diagnostic or emergency alerting system. See our{" "}
        <Link href="/privacy" className="underline">
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
