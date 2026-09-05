"use client";

import { MapPin } from "@phosphor-icons/react";
import { aqiCategoryLabel } from "@/src/lib/aqi-category";

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
  onClearSelection,
}: {
  byCity: Record<string, CityAqi> | null;
  loading: boolean;
  selectedKey?: string | null;
  onSelect?: (key: string) => void;
  onClearSelection?: () => void;
}) {
  const cities = Object.entries(byCity ?? {})
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => b.usAqi - a.usAqi) as (CityAqi & { key: string })[];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Perbandingan Kualitas Udara</h2>
          <p className="text-sm text-on-surface-variant">
            {cities.length > 0
              ? `${cities.length} lokasi terpantau, diperbarui dari sumber resmi. Ketuk kartu untuk fokus di peta.`
              : "Data live AQI per kota, diperbarui dari sumber resmi. Ketuk kartu untuk fokus di peta."}
          </p>
        </div>
        {selectedKey && onClearSelection && (
          <button
            type="button"
            onClick={onClearSelection}
            className="rounded-xl border border-surface-container bg-surface-container-lowest px-3 py-2 text-xs font-bold shadow-sm transition hover:shadow"
          >
            Tampilkan semua
          </button>
        )}
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
      ) : cities.length === 0 ? (
        <div className="rounded-2xl border border-surface-container bg-surface-container-low p-6 text-sm text-on-surface-variant">
          Belum ada data live. Isi AIR_VISUAL_API_KEY lalu buka <code className="rounded bg-white px-1">/api/air-quality?fetch=1</code> atau tunggu cron.
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-3 [direction:rtl]">
          {cities.map((c) => {
            const s = categoryStyle[c.aqiCategory] ?? categoryStyle.MODERATE;
            const active = selectedKey === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => (selectedKey === c.key ? onClearSelection?.() : onSelect?.(c.key))}
                className={`w-72 shrink-0 text-left [direction:ltr] rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md ${active ? "border-secondary bg-secondary-container/20 ring-2 ring-secondary/30" : "border-surface-container bg-surface-container-lowest"}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${s.bg} ${s.text}`}>{aqiCategoryLabel(c.aqiCategory)}</span>
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
