export interface MapProviderConfig {
  name: string;
  clientToken: string | null; // safe to expose publicly (e.g. Mapbox public token), null if unconfigured
  styleUrl?: string;
}

export interface MapProvider {
  readonly name: string;
  getClientConfig(): MapProviderConfig;
  getDirectionsUrl(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }): string;
}
