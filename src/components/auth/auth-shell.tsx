import type { ReactNode } from "react";
import Link from "next/link";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#0a1f1c] lg:flex lg:flex-col lg:justify-between p-12 text-brand-foreground">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(45,212,191,0.25), transparent 45%), radial-gradient(circle at 80% 70%, rgba(45,212,191,0.15), transparent 50%)",
          }}
        />
        <Link href="/" className="relative z-10 text-sm font-semibold tracking-tight">
          ClimateGuardian AI
        </Link>
        <div className="relative z-10 max-w-md">
          <p className="text-3xl font-semibold leading-tight tracking-tight">
            Predict Climate Risk.
            <br />
            Protect Human Health.
          </p>
          <p className="mt-4 text-sm text-teal-100/70">
            Real-time air, heat, water and disaster risk intelligence — built for people, cities and
            emergency response teams.
          </p>
        </div>
        <p className="relative z-10 text-xs text-teal-100/50">
          Environmental &amp; public-health guidance only — not a diagnostic or emergency alerting system.
        </p>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-10 inline-block text-sm font-semibold tracking-tight lg:hidden">
            ClimateGuardian AI
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-foreground-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
