import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

const GOVERNMENT_LINKS = [
  { href: "/government", label: "Overview" },
  { href: "/government/risk-map", label: "Risk Map" },
  { href: "/government/heat", label: "Heat" },
  { href: "/government/air", label: "Air" },
  { href: "/government/disease", label: "Disease" },
  { href: "/government/water", label: "Water" },
  { href: "/government/emergency", label: "Emergency" },
];

export default async function GovernmentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "GOVERNMENT" && session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <AppShell
      links={GOVERNMENT_LINKS}
      userName={session.user.name}
      role={session.user.role}
      isDemoAccount={session.user.isDemoAccount}
    >
      {children}
    </AppShell>
  );
}
