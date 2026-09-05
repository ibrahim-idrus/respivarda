"use client";

import { MapPin } from "@phosphor-icons/react";

type CityAqi = {
  city: string;
  usAqi: number;
  aqiCategory: string;
  mainPollutant?: string;
};

const categoryStyle: Record<string, { bg: string; text: string; dot: string }> = {
  GOOD: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  MODERATE: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  UNHEALTHY_SENSITIVE: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  UNHEALTHY: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  VERY_UNHEALTHY: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-600" },
  HAZARDOUS: { bg: "bg-zinc-900", text: "text-white", dot: "bg-zinc-900" },
};

export default function KaltimComparison({
  byCity,
  loading,
  selectedKey,
  onSelect,
}: {
  byCity: Record<string, CityAqi> | null;
  loading: boolean;
  selectedKey?: string | null;
  onSelect?: (key: string) => void;
}) {
  const order = ["Balikpapan", "Samarinda", "Penajam"];
  const cities = order
    .map((name) => {
      const k = Object.keys(byCity ?? {}).find((x) => x.toLowerCase().includes(name.toLowerCase()));
      return k ? { key: k, ...byCity![k] } : null;
    })
    .filter(Boolean) as (CityAqi & { key: string })[];

  const fallback = cities.length === 0 && byCity ? Object.entries(byCity).map(([key, v]) => ({ key, ...v })) as (CityAqi & { key: string })[] : cities;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <div className="mb-4">
        <h2 className="text-xl font-extrabold tracking-tight">Perbandingan Kualitas Udara</h2>
        <p className="text-sm text-on-surface-variant">Data live AQI per kota, diperbarui dari sumber resmi. Ketuk kartu untuk fokus di peta.</p>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-surface-container bg-surface-container-lowest p-4">
              <div className="h-4 w-24 rounded bg-surface-container" />
              <div className="mt-3 h-8 w-16 rounded bg-surface-container" />
            </div>
          ))}
        </div>
      ) : fallback.length === 0 ? (
        <div className="rounded-2xl border border-surface-container bg-surface-container-low p-6 text-sm text-on-surface-variant">
          Belum ada data live. Isi AIR_VISUAL_API_KEY lalu buka <code className="rounded bg-white px-1">/api/air-quality?fetch=1</code> atau tunggu cron.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {fallback.map((c) => {
            const s = categoryStyle[c.aqiCategory] ?? categoryStyle.MODERATE;
            const active = selectedKey === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onSelect?.(c.key)}
                className={`rounded-2xl border p-4 text-left shadow-sm transition-all hover:shadow-md ${active ? "border-secondary bg-secondary-container/20 ring-2 ring-secondary/30" : "border-surface-container bg-surface-container-lowest"}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s.bg} ${s.text}`}>{c.aqiCategory.replaceAll("_", " ")}</span>
                  <span className="text-[11px] font-medium text-on-surface-variant">AQI US</span>
                </div>
                <p className="flex items-center gap-1.5 text-sm font-extrabold">
                  <MapPin size={14} className="text-secondary" /> {c.city}
                </p>
                <p className="mt-1 text-2xl font-extrabold">
                  {c.usAqi} <span className="text-sm font-semibold text-on-surface-variant">AQI US</span>
                </p>
                <p className="flex items-center gap-1 text-xs font-semibold">
                  <span className={`h-2 w-2 rounded-full ${s.dot}`} /> Polutan utama: {c.mainPollutant ?? "—"}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
