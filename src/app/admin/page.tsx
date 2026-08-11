import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default function AdminOverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Access restricted to ADMIN role only — verified via role-based route protection.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>System management</CardTitle>
          <CardDescription>
            User/alert/location/hospital/shelter/data-source management and audit logging are built in a
            later phase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-border text-sm text-foreground-muted">
            No data yet.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
