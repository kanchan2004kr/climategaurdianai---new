export interface MapProviderConfig {
  name: string;
  /** Leaflet tile URL template. Free/open provider — no API key or billing required. */
  tileUrl: string;
  /** Dark-theme tile URL template, when the provider offers one. */
  tileUrlDark?: string;
  attribution: string;
  maxZoom: number;
}

export interface MapProvider {
  readonly name: string;
  getClientConfig(): MapProviderConfig;
  getDirectionsUrl(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }): string;
}
