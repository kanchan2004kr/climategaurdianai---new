export interface ReverseGeocodeResult {
  city?: string;
  region?: string;
  country?: string;
  /** Human-friendly label, best-effort. Falls back to coordinates when lookup fails. */
  label: string;
}

/**
 * Reverse-geocodes coordinates into a city/region label using BigDataCloud's
 * free client endpoint — no API key, no billing. Best-effort: on any failure or
 * timeout it degrades to a coordinate label rather than throwing, so "use my
 * current location" always resolves to *something* real (the actual coords).
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult> {
  const coordLabel = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
  try {
    const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set("localityLanguage", "en");

    const res = await fetch(url.toString(), {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { label: coordLabel };

    const json = await res.json();
    const city: string | undefined = json.city || json.locality || undefined;
    const region: string | undefined = json.principalSubdivision || undefined;
    const country: string | undefined = json.countryName || undefined;

    const label = city && region ? `${city}, ${region}` : city || region || country || coordLabel;
    return { city, region, country, label };
  } catch {
    return { label: coordLabel };
  }
}
