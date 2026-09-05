"use client";

import { useMemo } from "react";
import { Circle, MapContainer, Marker, Polygon, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair } from "@phosphor-icons/react";
import { MONITORED_LOCATIONS } from "@/lib/airvisual/monitored-locations";
import { KALTIM_POLYGONS, regionForPoint } from "@/src/lib/geo/kaltim";
import type { GeoState } from "@/src/hooks/useGeolocation";

type SmokeMapProps = {
  selectedKey: string | null;
  byCity: Record<string, { city: string; usAqi: number; aqiCategory: string; mainPollutant?: string; lat?: number; lon?: number }> | null;
  userCoords: GeoState;
};

const STATION_COVERAGE_M = 15000;

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

const stationPin = L.divIcon({
  className: "",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  html: `<span style="display:block;width:20px;height:20px;border-radius:4px;background:#0f172a;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.35)"></span>`,
});

function FlyTo({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useMemo(() => {
    if (center) map.flyTo(center, Math.max(map.getZoom(), 9), { duration: 0.6 });
  }, [center, map]);
  return null;
}

export default function SmokeMap({ selectedKey, byCity, userCoords }: SmokeMapProps) {
  const region = userCoords ? regionForPoint(userCoords.lat, userCoords.lon) : null;

  const selected = selectedKey && byCity?.[selectedKey] ? byCity[selectedKey] : null;
  const selectedLoc = useMemo(() => {
    if (!selected || selected.lat == null || selected.lon == null) return null;
    return [selected.lat, selected.lon] as [number, number];
  }, [selected]);

  const fallbackCenter: [number, number] = [-1.05, 116.9];

  const activeCategory = selected?.aqiCategory ?? "MODERATE";
  const activeColor = categoryColor(activeCategory);
  const activeDot = categoryDot(activeCategory);

  return (
    <div className="relative h-[300px] w-full overflow-hidden rounded-2xl border border-surface-container shadow-sm sm:h-[380px] lg:h-[460px]">
      <MapContainer center={fallbackCenter} zoom={8} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {Object.entries(KALTIM_POLYGONS).map(([name, poly]) => (
          <Polygon key={name} positions={poly} pathOptions={{ color: "#1e40af", fillColor: "#1e40af", fillOpacity: 0.06, weight: 2, dashArray: "8 6" }} />
        ))}
        {Object.values(MONITORED_LOCATIONS.reduce((acc, l) => ({ ...acc, [l.id]: [l.lat, l.lon] as [number, number] }), {} as Record<string, [number, number]>)).map(([lat, lon]) => (
          <Circle key={`${lat}-${lon}`} center={[lat, lon]} radius={STATION_COVERAGE_M} pathOptions={{ color: "#0f172a", fillColor: "#0f172a", fillOpacity: 0.04, weight: 1, dashArray: "4 6" }} />
        ))}
        {MONITORED_LOCATIONS.map((loc) => (
          <Marker key={loc.id} position={[loc.lat, loc.lon]} icon={stationPin} />
        ))}
        {selectedLoc && <Marker position={selectedLoc} icon={pin(activeColor)} />}
        {selectedLoc && <Circle center={selectedLoc} radius={1800} pathOptions={{ color: activeColor, fillColor: activeColor, fillOpacity: 0.14, weight: 2 }} />}
        {userCoords && <Marker position={[userCoords.lat, userCoords.lon]} icon={userPin} />}
        <FlyTo center={selectedLoc} />
      </MapContainer>

      <div className="pointer-events-none absolute left-3 top-3 z-[1000] max-w-[min(78%,22rem)] rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold shadow backdrop-blur sm:left-4 sm:top-4">
        <p className="flex items-center gap-1.5">
          <span className={`h-2 w-2 shrink-0 rounded-full ${activeDot}`} />
          <span className="leading-tight">{selected ? `${selected.city} • AQI ${selected.usAqi} ${selected.aqiCategory.replaceAll("_", " ")}` : "Pilih kota di daftar perbandingan untuk fokus di peta"}</span>
        </p>
      </div>
      {userCoords && (
        <div className="pointer-events-none absolute left-3 top-[3.75rem] z-[1000] flex max-w-[min(78%,22rem)] items-center gap-1.5 rounded-xl bg-white/95 px-3 py-2 text-xs font-semibold shadow backdrop-blur sm:left-4">
          <Crosshair size={14} className="shrink-0 text-primary" />
          <span className="leading-tight">{region ? `Cakupan ${region}` : "Di luar cakupan sorotan"}</span>
        </div>
      )}
    </div>
  );
}
