"use client";

import { Badge } from "@cloudflare/kumo";
import { DISTRICTS, SCENARIO_STYLES } from "@/src/lib/mock-data";
import type { District } from "@/src/lib/mock-data";

export default function SurroundingDistricts({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (d: District) => void;
}) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <div className="mb-4">
        <h2 className="text-xl font-extrabold tracking-tight">
          Smoke Around Your Area
        </h2>
        <p className="text-sm text-on-surface-variant">
          Surrounding districts relative to your selected point — real-time
          optical particulate density across Balikpapan municipalities
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DISTRICTS.map((d) => {
          const s = SCENARIO_STYLES[d.scenario];
          const active = d.id === activeId;
          return (
            <button
              key={d.id}
              onClick={() => onSelect(d)}
              className={`rounded-2xl border p-4 text-left transition-shadow hover:shadow-md ${
                active
                  ? "border-secondary bg-surface-container-lowest shadow-md ring-2 ring-secondary/30"
                  : "border-surface-container bg-surface-container-lowest"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s.bg} ${s.text}`}
                >
                  {d.label}
                </span>
                <Badge variant={active ? "primary" : "secondary"}>
                  {d.tagline}
                </Badge>
              </div>
              <p className="text-sm font-extrabold">{d.name}</p>
              <p className="text-xs text-on-surface-variant">
                {d.category} • AQI {d.aqi}
              </p>
              <p className="mt-2 flex items-center gap-1 text-xs font-semibold">
                <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                Distance: {d.distanceKm} km
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
