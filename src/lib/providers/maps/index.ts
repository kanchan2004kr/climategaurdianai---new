import type { MapProvider, MapProviderConfig } from "./types";

class MapboxProvider implements MapProvider {
  readonly name = "Mapbox";

  getClientConfig(): MapProviderConfig {
    return {
      name: this.name,
      clientToken: process.env.MAPBOX_TOKEN?.startsWith("pk.") ? process.env.MAPBOX_TOKEN : null,
      styleUrl: "mapbox://styles/mapbox/light-v11",
    };
  }

  getDirectionsUrl(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) {
    return `https://www.google.com/maps/dir/?api=1&origin=${from.latitude},${from.longitude}&destination=${to.latitude},${to.longitude}`;
  }
}

export function getMapProvider(): MapProvider {
  return new MapboxProvider();
}

export type { MapProvider, MapProviderConfig };
