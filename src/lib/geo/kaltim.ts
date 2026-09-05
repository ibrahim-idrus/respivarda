export type KaltimRegion = "balikpapan" | "samarinda" | "penajam";

export const KALTIM_CENTERS: Record<KaltimRegion, [number, number]> = {
  balikpapan: [-1.2379, 116.8528],
  samarinda: [-0.5022, 117.1536],
  penajam: [-1.2805, 116.7136],
};

export const KALTIM_POLYGONS: Record<KaltimRegion, [number, number][]> = {
  balikpapan: [
    [-1.05, 116.7],
    [-1.05, 117.0],
    [-1.42, 117.0],
    [-1.42, 116.7],
  ],
  samarinda: [
    [-0.35, 117.0],
    [-0.35, 117.35],
    [-0.7, 117.35],
    [-0.7, 117.0],
  ],
  penajam: [
    [-1.15, 116.55],
    [-1.15, 116.9],
    [-1.45, 116.9],
    [-1.45, 116.55],
  ],
};

export const STATION_COVERAGE_M = 15000;

function pointInPolygon(lat: number, lon: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i];
    const [yj, xj] = poly[j];
    const intersect = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function regionForPoint(lat: number, lon: number): KaltimRegion | null {
  for (const r of Object.keys(KALTIM_POLYGONS) as KaltimRegion[]) {
    if (pointInPolygon(lat, lon, KALTIM_POLYGONS[r])) return r;
  }
  return null;
}
