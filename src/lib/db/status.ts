const PLACEHOLDER_MARKERS = ["your-supabase", "user:password@localhost"];

/**
 * True only when DATABASE_URL looks like a real Postgres connection string
 * rather than the placeholder shipped in .env.example. This does not verify
 * connectivity — only that a real value was configured.
 */
export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  if (!url.startsWith("postgres")) return false;
  return !PLACEHOLDER_MARKERS.some((marker) => url.includes(marker));
}
