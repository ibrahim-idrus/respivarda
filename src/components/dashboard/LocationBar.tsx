"use client";

import { useState } from "react";
import { Button, Input } from "@cloudflare/kumo";
import { Crosshair, MapPinArea, NavigationArrow } from "@phosphor-icons/react";
import type { District, Scenario } from "@/src/lib/mock-data";

// ponytail: simulated geolocation — ceiling: button only fakes a browser fix
// with a timeout. upgrade: navigator.geolocation + reverse geocode.
// ponytail: keyword search — ceiling: three hardcoded substrings.
// upgrade: filter DISTRICTS, then a real geocoder.
export default function LocationBar({
  activeDistrict,
  onScenario,
  onUseMyLocation,
  onOpenModal,
  locating,
}: {
  activeDistrict: District;
  onScenario: (s: Scenario) => void;
  onUseMyLocation: () => void;
  onOpenModal: () => void;
  locating: boolean;
}) {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    const v = query.toLowerCase();
    if (v.includes("utara")) onScenario("safe");
    else if (v.includes("tengah")) onScenario("warning");
    else onScenario("affected");
  };

  const scenarios: { key: Scenario; label: string }[] = [
    { key: "affected", label: "Balikpapan Sel. (Terdampak)" },
    { key: "warning", label: "Balikpapan Tengah (Waspada)" },
    { key: "safe", label: "Balikpapan Utara (Aman)" },
  ];

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-24 sm:px-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-2xl border border-surface-container bg-surface-container-lowest p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-on-surface-variant">Wilayah pantau:</span>
          <span className="flex items-center gap-1 font-bold">
            <MapPinArea size={16} className="text-secondary" />
            {activeDistrict.name}, Kalimantan Timur
          </span>
          <button onClick={onOpenModal} className="text-xs font-semibold text-secondary underline underline-offset-2">
            Ganti Lokasi
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-on-surface-variant">Pratinjau skenario:</span>
          {scenarios.map((s) => (
            <button
              key={s.key}
              onClick={() => onScenario(s.key)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                activeDistrict.scenario === s.key
                  ? "border-secondary bg-secondary-container text-on-secondary-container"
                  : "border-surface-container bg-surface-container-low text-on-surface-variant hover:border-secondary"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          <span className="hidden items-center gap-1 text-[11px] text-on-surface-variant xl:flex">
            <NavigationArrow size={14} />
            Izinkan lokasi browser untuk peringatan asap yang lebih akurat
          </span>
          <Button variant="outline" size="sm" icon={<Crosshair />} loading={locating} onClick={onUseMyLocation}>
            Gunakan Lokasi Saya
          </Button>
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
          >
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari kecamatan…" aria-label="Cari kecamatan" />
            <Button type="submit" variant="secondary" size="sm">
              Cari
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
