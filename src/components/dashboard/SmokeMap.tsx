"use client";

import { useEffect, useMemo, useState } from "react";
import { Circle, GeoJSON, MapContainer, Marker, TileLayer, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import type { FeatureCollection } from "geojson";
import "leaflet/dist/leaflet.css";
import { Crosshair } from "@phosphor-icons/react";
import { aqiCategoryLabel } from "@/src/lib/aqi-category";
import type { GeoState } from "@/src/hooks/useGeolocation";

type SmokeMapProps = {
  selectedKey: string | null;
  byCity: Record<string, { city: string; usAqi: number; aqiCategory: string; mainPollutant?: string; lat?: number; lon?: number }> | null;
  userCoords: GeoState;
  myLocation?: { lat: number; lon: number; city: string; aqiCategory: string } | null;
  onClearSelection?: () => void;
};

function categoryColor(cat: string): string {
  if (cat === "GOOD") return "#059669";
  if (cat === "MODERATE") return "#d97706";
  if (cat === "UNHEALTHY_SENSITIVE") return "#ea580c";
  if (cat === "UNHEALTHY") return "#e11d48";
  if (cat === "VERY_UNHEALTHY") return "#dc2626";
  return "#18181b";
}

function categoryDot(cat: string): string {
  if (cat === "GOOD") return "bg-emerald-500";
  if (cat === "MODERATE") return "bg-amber-500";
  if (cat === "UNHEALTHY_SENSITIVE") return "bg-orange-500";
  if (cat === "UNHEALTHY") return "bg-rose-500";
  if (cat === "VERY_UNHEALTHY") return "bg-red-600";
  return "bg-zinc-900";
}

const pin = (color: string) =>
  L.divIcon({
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    html: `<span style="display:block;width:24px;height:24px;border-radius:9999px;background:${color};border:4px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.35)"></span>`,
  });

const userPin = L.divIcon({
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  html: `<span style="display:block;width:28px;height:28px;border-radius:9999px;background:#2563eb;border:4px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></span>`,
});

const stationPin = (color: string) =>
  L.divIcon({
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: `<span style="display:block;width:20px;height:20px;border-radius:4px;background:${color};border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.35)"></span>`,
  });

function FlyTo({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useMemo(() => {
    if (center) map.flyTo(center, Math.max(map.getZoom(), 9), { duration: 0.6 });
  }, [center, map]);
  return null;
}

export default function SmokeMap({ selectedKey, byCity, userCoords, myLocation, onClearSelection }: SmokeMapProps) {
  const [boundaries, setBoundaries] = useState<FeatureCollection | null>(null);
  const nearestCity = useMemo(() => {
    if (!userCoords) return null;
    let best: { city: string; distKm: number } | null = null;
    for (const v of Object.values(byCity ?? {})) {
      if (v.lat == null || v.lon == null) continue;
      const dLat = ((v.lat - userCoords.lat) * Math.PI) / 180;
      const dLon = ((v.lon - userCoords.lon) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((userCoords.lat * Math.PI) / 180) * Math.cos((v.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
      const distKm = 2 * 6371 * Math.asin(Math.sqrt(a));
      if (!best || distKm < best.distKm) best = { city: v.city, distKm };
    }
    return best;
  }, [userCoords, byCity]);

  useEffect(() => {
    fetch("/geo/kalimantan-coverage.geojson")
      .then((response) => response.json())
      .then(setBoundaries)
      .catch(() => setBoundaries(null));
  }, []);

  const selected = selectedKey && byCity?.[selectedKey] ? byCity[selectedKey] : null;
  const selectedLoc = useMemo(() => {
    if (myLocation) return [myLocation.lat, myLocation.lon] as [number, number];
    if (!selected || selected.lat == null || selected.lon == null) return null;
    return [selected.lat, selected.lon] as [number, number];
  }, [selected, myLocation]);

  const fallbackCenter: [number, number] = useMemo(() => {
    const pts = Object.values(byCity ?? {}).filter((v) => v.lat != null && v.lon != null);
    if (pts.length === 0) return [-1.05, 116.9];
    const lat = pts.reduce((s, v) => s + (v.lat ?? 0), 0) / pts.length;
    const lon = pts.reduce((s, v) => s + (v.lon ?? 0), 0) / pts.length;
    return [lat, lon];
  }, [byCity]);

  const mapZoom = useMemo(() => {
    const n = Object.keys(byCity ?? {}).length;
    if (n <= 3) return 8;
    if (n <= 6) return 6;
    return 5;
  }, [byCity]);

  const activeCategory = myLocation?.aqiCategory ?? selected?.aqiCategory ?? "MODERATE";
  const activeColor = categoryColor(activeCategory);
  const activeDot = categoryDot(activeCategory);
  const activeCity = myLocation?.city ?? selected?.city ?? null;
  const activeAqi = myLocation ? byCity?.[Object.keys(byCity ?? {}).find((k) => byCity[k].city === myLocation.city) ?? ""]?.usAqi ?? selected?.usAqi ?? null : selected?.usAqi ?? null;

  const cityPoints = useMemo(() => {
    const pts = Object.values(byCity ?? {}).filter((v) => v.lat != null && v.lon != null);
    return pts.map((v) => {
      const norm = v.city.toLowerCase().replace(/^kota\s+/, "");
      const match = boundaries?.features.find((f) => {
        const w = String((f.properties as { WADMKK?: string } | null)?.WADMKK ?? "").toLowerCase().replace(/^kota\s+/, "");
        return w === norm || (norm && (w.includes(norm) || norm.includes(w)));
      });
      return { ...v, boundaryMatch: match ?? null };
    });
  }, [byCity, boundaries]);

  const polygonByCity = useMemo(() => {
    const byName = new Map<string, { aqiCategory: string }>();
    for (const v of cityPoints) {
      const w = v.boundaryMatch ? String((v.boundaryMatch.properties as { WADMKK?: string })?.WADMKK ?? v.city) : v.city;
      byName.set(w.toLowerCase().replace(/^kota\s+/, ""), v);
    }
    return byName;
  }, [cityPoints]);

  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-2xl border border-surface-container shadow-sm sm:h-[480px] lg:h-[560px]">
      <MapContainer center={fallbackCenter} zoom={mapZoom} scrollWheelZoom={false} zoomControl={false} className="h-full w-full">
        <ZoomControl position="bottomleft" />
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {boundaries && (
          <GeoJSON
            key={`${selectedKey ?? "all"}|${polygonByCity ? [...polygonByCity].map(([name, value]) => `${name}:${value.aqiCategory}`).join("|") : "empty"}|${cityPoints.filter((v) => !v.boundaryMatch).map((v) => `${v.city}:${v.aqiCategory}`).join("|")}`}
            data={boundaries}
            style={(feature) => {
              const name = feature?.properties?.WADMKK?.toLowerCase().replace(/^kota\s+/, "");
              const entry = name ? polygonByCity?.get(name) : null;
              if (selected && entry) {
                const selectedName = selected.city.toLowerCase().replace(/^kota\s+/, "");
                const isSelected =
                  name === selectedName || (selectedName && (name.includes(selectedName) || selectedName.includes(name)));
                if (!isSelected) return { color: "#94a3b8", fillColor: "#94a3b8", fillOpacity: 0.03, weight: 1 };
              }
              const color = entry ? categoryColor(entry.aqiCategory) : "#64748b";
              return { color, fillColor: color, fillOpacity: entry ? 0.14 : 0.02, weight: entry ? 1.8 : 1.2 };
            }}
          />
        )}
        {cityPoints
          .filter((v) => !v.boundaryMatch)
          .map((v) => {
            const isDimmed = selected ? v.city !== selected.city : false;
            const color = isDimmed ? "#94a3b8" : categoryColor(v.aqiCategory);
            return (
              <Circle
                key={`halo-${v.city}`}
                center={[v.lat!, v.lon!]}
                radius={15000}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: isDimmed ? 0.03 : 0.14,
                  weight: 1.6,
                }}
              />
            );
          })}
        {cityPoints.map((v) => {
          const isDimmed = selected ? v.city !== selected.city : false;
          const color = isDimmed ? "#94a3b8" : categoryColor(v.aqiCategory);
          return <Marker key={v.city} position={[v.lat!, v.lon!]} icon={stationPin(color)} />;
        })}
        {selectedLoc && <Marker position={selectedLoc} icon={pin(activeColor)} />}
        {userCoords && <Marker position={[userCoords.lat, userCoords.lon]} icon={userPin} />}
        <FlyTo center={selectedLoc} />
      </MapContainer>

      <div className="pointer-events-none absolute bottom-3 left-14 z-[1000] max-w-[min(68%,22rem)] rounded-xl bg-white/95 px-3 py-2 text-xs font-semibold shadow backdrop-blur sm:bottom-4 sm:left-16">
        <p className="flex items-center gap-1.5">
          <span className={`h-2 w-2 shrink-0 rounded-full ${activeDot}`} />
          <span className="leading-tight">{activeCity ? `${activeCity}${activeAqi != null ? ` • AQI ${activeAqi}` : ""} ${aqiCategoryLabel(activeCategory)}` : "Pilih kota di daftar perbandingan untuk fokus di peta"}</span>
        </p>
      </div>
      {selected && onClearSelection && (
        <button
          type="button"
          onClick={onClearSelection}
          className="absolute right-3 top-3 z-[1000] rounded-xl bg-white/95 px-3 py-2 text-xs font-bold shadow backdrop-blur transition hover:bg-white"
        >
          Tampilkan semua
        </button>
      )}
      {userCoords && nearestCity && (
        <div className="pointer-events-none absolute bottom-3 left-[14.5rem] z-[1000] hidden items-center gap-1.5 rounded-xl bg-white/95 px-3 py-2 text-xs font-semibold shadow backdrop-blur sm:flex">
          <Crosshair size={14} className="shrink-0 text-primary" />
          <span className="leading-tight">Terdekat: {nearestCity.city} ({nearestCity.distKm < 1 ? `${Math.round(nearestCity.distKm * 1000)} m` : `${nearestCity.distKm.toFixed(0)} km`})</span>
        </div>
      )}
    </div>
  );
}
