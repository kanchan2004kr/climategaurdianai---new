import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

const ADMIN_LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/alerts", label: "Alerts" },
  { href: "/admin/locations", label: "Locations" },
  { href: "/admin/hospitals", label: "Hospitals" },
  { href: "/admin/shelters", label: "Shelters" },
  { href: "/admin/data-sources", label: "Data Sources" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <AppShell
      links={ADMIN_LINKS}
      userName={session.user.name}
      role={session.user.role}
      isDemoAccount={session.user.isDemoAccount}
    >
      {children}
    </AppShell>
  );
}
