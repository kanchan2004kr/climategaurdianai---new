"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import Link from "next/link";

const DEMO_ACCOUNTS = [
  { label: "Citizen", email: "demo@climateguardian.ai" },
  { label: "Government", email: "gov@climateguardian.ai" },
  { label: "Admin", email: "admin@climateguardian.ai" },
];

export function LoginForm({ isDemoMode }: { isDemoMode: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    const result = await signIn("credentials", {
      ...values,
      redirect: false,
    });

    if (result?.error) {
      setFormError("Invalid email or password. Try a demo account below, or check your credentials.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}

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
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-risk-high">{errors.password.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting} className="mt-2">
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {isDemoMode && (
        <div className="rounded-lg border border-border bg-surface-muted p-4">
          <p className="text-xs font-medium text-foreground-muted">
            Demo mode — no live database connected yet. Use a demo account (password: <code>demo1234</code>):
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setValue("email", account.email);
                  setValue("password", "demo1234");
                }}
                className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-foreground-muted transition-colors hover:border-brand hover:text-brand"
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-sm text-foreground-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-brand hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
