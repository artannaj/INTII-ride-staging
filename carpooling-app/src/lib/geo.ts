export type LatLng = { latitude: number; longitude: number };

/** Builds a LatLng only when both parts are present (API fields are nullable). */
export function toLatLng(lat: number | null | undefined, lng: number | null | undefined): LatLng | null {
  return lat != null && lng != null ? { latitude: lat, longitude: lng } : null;
}

/** Great-circle distance in kilometres. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Rough ETA. Straight-line distance is stretched by 1.3 to approximate real
 * roads, at an average 35 km/h for Klang Valley traffic.
 */
export function etaMinutes(from: LatLng, to: LatLng): number {
  const roadKm = distanceKm(from, to) * 1.3;
  return Math.max(1, Math.round((roadKm / 35) * 60));
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}
