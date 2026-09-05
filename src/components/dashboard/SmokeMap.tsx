"use client";

import { Circle, MapContainer, Marker, Polygon, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Crosshair, Wind } from "@phosphor-icons/react";
import type { District, Scenario } from "@/src/lib/mock-data";
import { SCENARIO_STYLES } from "@/src/lib/mock-data";
import { KALTIM_CENTERS, KALTIM_POLYGONS, STATION_COVERAGE_M, regionForPoint } from "@/src/lib/geo/kaltim";
import type { GeoState } from "@/src/hooks/useGeolocation";

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

const RADIUS: Record<Scenario, number> = {
  affected: 2600,
  warning: 3600,
  safe: 2600,
};

export default function SmokeMap({ district, userCoords }: { district: District; userCoords: GeoState }) {
  const style = SCENARIO_STYLES[district.scenario];
  const center: [number, number] = [district.lat, district.lng];
  const region = userCoords ? regionForPoint(userCoords.lat, userCoords.lon) : null;

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-surface-container shadow-sm">
      <MapContainer key={district.id} center={[-1.05, 116.9]} zoom={8} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {Object.entries(KALTIM_POLYGONS).map(([name, poly]) => (
          <Polygon key={name} positions={poly} pathOptions={{ color: "#1e40af", fillColor: "#1e40af", fillOpacity: 0.06, weight: 2, dashArray: "8 6" }} />
        ))}
        {Object.values(KALTIM_CENTERS).map(([lat, lon]) => (
          <Circle key={`${lat}-${lon}`} center={[lat, lon]} radius={STATION_COVERAGE_M} pathOptions={{ color: "#0f172a", fillColor: "#0f172a", fillOpacity: 0.04, weight: 1, dashArray: "4 6" }} />
        ))}
        {Object.entries(KALTIM_CENTERS).map(([name, pos]) => (
          <Marker key={name} position={pos} icon={stationPin} />
        ))}
        <Circle center={center} radius={RADIUS[district.scenario]} pathOptions={{ color: style.mapColor, fillColor: style.mapColor, fillOpacity: 0.18, weight: 2, dashArray: "6 6" }} />
        <Marker position={center} icon={pin(style.mapColor)} />
        {userCoords && <Marker position={[userCoords.lat, userCoords.lon]} icon={userPin} />}
      </MapContainer>

      <div className="absolute left-4 top-4 z-[1000] rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold shadow backdrop-blur">
        <p className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
          Titik pantau aktif • {district.distanceKm} km dari pusat sebaran
        </p>
      </div>
      {userCoords && (
        <div className="absolute left-4 top-14 z-[1000] flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-2 text-xs font-semibold shadow backdrop-blur">
          <Crosshair size={14} className="text-primary" />
          {region ? `Di dalam domisili ${region} (cakupan Kaltim)` : "Di luar domisili Kaltim"}
        </div>
      )}
      <div className="absolute bottom-4 left-4 z-[1000] flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold shadow backdrop-blur">
        <Wind size={16} className="text-secondary" />
        Angin: 14 km/jam Barat Daya • Kelembapan: 58%
      </div>
      <div className="absolute bottom-4 right-4 z-[1000] rounded-xl bg-primary/90 px-3 py-2 text-[11px] font-medium text-white shadow">Kaltim 3 kota via nearest_city • Arsiran = domisili per kota</div>
    </div>
  );
}
