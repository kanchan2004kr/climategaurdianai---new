/** Formats an ISO timestamp as a short relative string, e.g. "Updated 4 min ago". Never invents a timestamp. */
export function formatRelativeMinutes(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  const diffMs = now.getTime() - then;
  const diffMin = Math.max(0, Math.round(diffMs / 60000));

  if (diffMin < 1) return "Updated just now";
  if (diffMin === 1) return "Updated 1 min ago";
  if (diffMin < 60) return `Updated ${diffMin} min ago`;

  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `Updated ${diffHr}h ago`;

  const diffDay = Math.round(diffHr / 24);
  return `Updated ${diffDay}d ago`;
}
