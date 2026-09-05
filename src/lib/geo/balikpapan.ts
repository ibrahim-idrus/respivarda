export const BALIKPAPAN_CENTER: [number, number] = [-1.2379, 116.8528];

export const BALIKPAPAN_POLYGON: [number, number][] = [
  [-1.05, 116.7],
  [-1.05, 117.0],
  [-1.42, 117.0],
  [-1.42, 116.7],
];

export const BALIKPAPAN_STATION: [number, number] = [-1.2379, 116.8528];
export const STATION_COVERAGE_M = 15000;

export function isInsideBalikpapan(lat: number, lon: number): boolean {
  let inside = false;
  for (let i = 0, j = BALIKPAPAN_POLYGON.length - 1; i < BALIKPAPAN_POLYGON.length; j = i++) {
    const [yi, xi] = BALIKPAPAN_POLYGON[i];
    const [yj, xj] = BALIKPAPAN_POLYGON[j];
    if (yi === yj && xi === xj) continue;
    const intersect = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
