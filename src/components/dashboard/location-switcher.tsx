"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin } from "lucide-react";
import type { LocationOption } from "@/lib/services/dashboard/locations";

export function LocationSwitcher({ locations, currentId }: { locations: LocationOption[]; currentId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleChange(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("location", id);
    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`);
    });
  }

  return (
    <label className="flex max-w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm">
      <MapPin className="size-4 shrink-0 text-brand" aria-hidden="true" />
      <span className="sr-only">Location</span>
      <select
        value={currentId}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isPending}
        className="max-w-40 truncate bg-transparent text-foreground outline-none disabled:opacity-60 sm:max-w-none"
        aria-label="Select location"
      >
        {locations.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.name}
            {loc.region ? `, ${loc.region}` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
