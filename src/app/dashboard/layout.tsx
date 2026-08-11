import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { USER_NAV_LINKS } from "@/lib/nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AppShell
      links={USER_NAV_LINKS}
      userName={session.user.name}
      role={session.user.role}
      isDemoAccount={session.user.isDemoAccount}
    >
      {children}
    </AppShell>
  );
}
