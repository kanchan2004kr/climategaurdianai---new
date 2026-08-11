import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function RiskDetailPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-4">
      <Link href="/dashboard" className="flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground">
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-border text-sm text-foreground-muted">
            The full detail view (trend history, contributing factors, precautions) is built in Phase 4C.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
