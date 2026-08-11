import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <p className="text-xs font-medium uppercase tracking-widest text-brand">404</p>
      <h1 className="text-xl font-semibold text-foreground">Page not found</h1>
      <p className="max-w-md text-sm text-foreground-muted">
        The page you&apos;re looking for doesn&apos;t exist or hasn&apos;t been built yet.
      </p>
      <Link href="/dashboard" className={buttonVariants({ size: "sm" })}>
        Back to dashboard
      </Link>
    </div>
  );
}
