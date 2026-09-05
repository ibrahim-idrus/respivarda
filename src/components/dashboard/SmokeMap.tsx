"use client";

import { MapContainer, TileLayer, Circle, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Wind } from "@phosphor-icons/react";
import type { District, Scenario } from "@/src/lib/mock-data";
import { SCENARIO_STYLES } from "@/src/lib/mock-data";

// ponytail: single OSM tile layer + native zoomControl — ceiling: no
// satellite/terrain toggle and default Leaflet chrome. upgrade: add
// LayersControl with an Esri tile layer; CSS-override .leaflet-control-zoom.

const pin = (color: string) =>
  L.divIcon({
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    html: `<span style="display:block;width:24px;height:24px;border-radius:9999px;background:${color};border:4px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.35)"></span>`,
  });

const RADIUS: Record<Scenario, number> = {
  affected: 2600,
  warning: 3600,
  safe: 2600,
};

export default function SmokeMap({ district }: { district: District }) {
  const style = SCENARIO_STYLES[district.scenario];
  const center: [number, number] = [district.lat, district.lng];

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-surface-container shadow-sm">
      <MapContainer
        key={district.id}
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle
          center={center}
          radius={RADIUS[district.scenario]}
          pathOptions={{
            color: style.mapColor,
            fillColor: style.mapColor,
            fillOpacity: 0.18,
            weight: 2,
            dashArray: "6 6",
          }}
        />
        <Marker position={center} icon={pin(style.mapColor)} />
      </MapContainer>

      {/* Overlay chips */}
      <div className="absolute left-4 top-4 z-[1000] rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold shadow backdrop-blur">
        <p className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
          Active Monitoring Point • {district.distanceKm} km from plume center
        </p>
      </div>
      <div className="absolute bottom-4 left-4 z-[1000] flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold shadow backdrop-blur">
        <Wind size={16} className="text-secondary" />
        Wind: 14 km/h SW • Humidity: 58%
      </div>
      <div className="absolute bottom-4 right-4 z-[1000] rounded-xl bg-primary/90 px-3 py-2 text-[11px] font-medium text-white shadow">
        Satellite &amp; Terrestrial Sensor Feed Live • Data: BMKG Sepinggan &amp;
        Sentinel-5P
      </div>
    </div>
  );
}
