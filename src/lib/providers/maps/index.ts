import type { MapProvider, MapProviderConfig } from "./types";

/**
 * Carto's free basemaps (basemaps.cartocdn.com) — no API key, no billing/credit
 * card, and their usage policy permits application traffic (unlike raw OSM tiles,
 * which discourage production use). Rendered client-side via Leaflet.
 */
class CartoMapProvider implements MapProvider {
  readonly name = "Carto";

  getClientConfig(): MapProviderConfig {
    return {
      name: this.name,
      tileUrl: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      tileUrlDark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    };
  }

  getDirectionsUrl(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) {
    return `https://www.google.com/maps/dir/?api=1&origin=${from.latitude},${from.longitude}&destination=${to.latitude},${to.longitude}`;
  }
}

export function getMapProvider(): MapProvider {
  return new CartoMapProvider();
}

export type { MapProvider, MapProviderConfig };
