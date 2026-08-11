import Link from "next/link";
import type { ReactNode } from "react";
import { NavLinks, type NavLink } from "./nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";

interface AppShellProps {
  children: ReactNode;
  links: NavLink[];
  userName?: string | null;
  role: string;
  isDemoAccount?: boolean;
}

export function AppShell({ children, links, userName, role, isDemoAccount }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/dashboard" className="text-sm font-semibold tracking-tight text-foreground">
              ClimateGuardian <span className="text-brand">AI</span>
            </Link>
            <div className="flex items-center gap-2">
              {isDemoAccount && <Badge variant="brand">Demo account</Badge>}
              <span className="hidden text-sm text-foreground-muted sm:inline">{userName}</span>
              <Badge variant="neutral">{role}</Badge>
              <ThemeToggle />
              <SignOutButton />
            </div>
          </div>
          <NavLinks links={links} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
