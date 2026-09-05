"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Dialog, Button } from "@cloudflare/kumo";
import { CheckCircle, Fire, MapPin, Info } from "@phosphor-icons/react";
import Header from "./Header";
import LocationBar from "./LocationBar";
import SurroundingDistricts from "./SurroundingDistricts";
import StatusPanel from "./StatusPanel";
import { DISTRICTS, SCENARIO_STYLES } from "@/src/lib/mock-data";
import type { District, Scenario } from "@/src/lib/mock-data";
import { useGeolocation } from "@/src/hooks/useGeolocation";
import { isInsideBalikpapan } from "@/src/lib/geo/balikpapan";

const SmokeMap = dynamic(() => import("./SmokeMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center rounded-2xl border border-surface-container bg-surface-container-low text-sm text-on-surface-variant">
      Loading map…
    </div>
  ),
});

const DISTRICT_BY_SCENARIO: Record<Scenario, string> = {
  affected: "selatan",
  warning: "tengah",
  safe: "utara",
};

export default function Dashboard() {
  const [district, setDistrict] = useState<District>(DISTRICTS[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const { coords, loading: locating, error: geoError, locate } = useGeolocation();
  const [liveAqi, setLiveAqi] = useState<{ usAqi: number; category: string; city: string; fetchedAt: string } | null>(null);

  const selectScenario = (s: Scenario) => {
    const target = DISTRICTS.find((d) => d.id === DISTRICT_BY_SCENARIO[s]);
    if (target) setDistrict(target);
  };

  const useMyLocation = () => locate();

  useEffect(() => {
    fetch("/api/air-quality?fetch=1")
      .then((r) => r.json())
      .then((j) => {
        const latest = j.data;
        if (latest?.airQualityRecord) setLiveAqi({ usAqi: latest.airQualityRecord.usAqi, category: latest.aqiCategory, city: latest.airQualityRecord.city, fetchedAt: latest.storedAt });
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <Header onOpenModal={() => setModalOpen(true)} />
      <main className="flex flex-1 flex-col gap-8 pb-16">
        <LocationBar
          activeDistrict={district}
          onScenario={selectScenario}
          onUseMyLocation={useMyLocation}
          onOpenModal={() => setModalOpen(true)}
          locating={locating}
        />

        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Regional Smoke Dispersion &amp; Proximity Map</h2>
              <p className="text-sm text-on-surface-variant">Balikpapan — 1 fetch via AirVisual nearest_city (hemat limit) • Arsiran = domisili + coverage 15 km</p>
            </div>
            {liveAqi && (
              <div className="rounded-xl border border-surface-container bg-surface-container-lowest px-3 py-2 text-xs">
                <p className="font-bold flex items-center gap-1.5"><MapPin size={14} className="text-secondary" /> {liveAqi.city} • AQI {liveAqi.usAqi} {liveAqi.category}</p>
                <p className="text-on-surface-variant">Fetched {new Date(liveAqi.fetchedAt).toLocaleString("id-ID")}</p>
              </div>
            )}
          </div>
          {geoError && <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{geoError}</p>}
          {coords && <p className="mb-3 rounded-xl border border-surface-container bg-white px-3 py-2 text-xs">Lokasi kamu: {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)} — {isInsideBalikpapan(coords.lat, coords.lon) ? "Di dalam domisili Balikpapan (ter-cover stasiun)" : "Di luar domisili Balikpapan (data tetap pakai Balikpapan terdekat)"}</p>}
          <SmokeMap district={district} userCoords={coords} />
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
            <p className="flex items-center gap-2 font-extrabold text-amber-900"><Fire size={18} weight="fill" className="text-amber-600" /> Sumber titik kebakaran / hotspot</p>
            <p className="mt-1 text-amber-800">AirVisual <code className="rounded bg-amber-100 px-1">nearest_city</code> tidak menyediakan hotspot — hanya AQI {liveAqi?.usAqi ?? "—"} dan polutan untuk Balikpapan. Titik karhutla butuh API terpisah seperti NASA FIRMS (VIIRS/MODIS) atau BMKG — belum diaktifkan agar tidak menambah limit. Saat AQI naik + PM2.5 dominan, anggap ada pengaruh asap di sekitar.</p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700"><Info size={14} /> Stasiun AirVisual butuh plan Startup berbayar; coverage di peta hanya visualisasi 15 km dari koordinat Balikpapan, bukan radius resmi stasiun.</p>
          </div>
        </section>

        <SurroundingDistricts activeId={district.id} onSelect={setDistrict} />
        <StatusPanel district={district} />

        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="rounded-2xl border border-surface-container bg-surface-container-low p-6 text-sm text-on-surface-variant">
            <p className="mb-1 font-extrabold text-on-surface">
              About SmokeWatch Civic Service
            </p>
            SmokeWatch operates as a frictionless, anonymous environmental
            hazard monitoring system. It fuses satellite infrared imagery
            (Copernicus Sentinel-5P, MODIS/VIIRS) with distributed ground
            optical sensors to deliver neighborhood-level smoke dispersion
            radar without requiring sign-ins, cookies, or profiling.
          </div>
        </section>
      </main>

      <footer className="border-t border-surface-container bg-surface-container-lowest py-6 text-center text-xs text-on-surface-variant">
        © 2025 SmokeWatch Public Environmental Telemetry. Distributed under Open
        Civic Data License. • Copernicus Attribution
      </footer>

      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog className="p-6" size="lg">
          <div className="mb-4 flex items-start justify-between">
            <Dialog.Title className="text-lg font-extrabold">
              Select Monitoring Location
            </Dialog.Title>
            <Dialog.Close render={(p) => <Button {...p} variant="ghost" size="sm">✕</Button>} />
          </div>
          <Dialog.Description className="mb-4 text-sm text-on-surface-variant">
            Choose a Balikpapan district or test different smoke exposure zones:
          </Dialog.Description>
          <ul className="space-y-2">
            {DISTRICTS.map((d) => {
              const s = SCENARIO_STYLES[d.scenario];
              const active = d.id === district.id;
              return (
                <li key={d.id}>
                  <button
                    onClick={() => {
                      setDistrict(d);
                      setModalOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                      active
                        ? "border-secondary bg-secondary-container/40"
                        : "border-surface-container hover:border-secondary"
                    }`}
                  >
                    <span>
                      <span className="block font-bold">{d.name}</span>
                      <span className="text-xs text-on-surface-variant">
                        {d.category} • AQI {d.aqi} • {d.distanceKm} km
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
                      {active && (
                        <CheckCircle
                          size={18}
                          weight="fill"
                          className="text-secondary"
                        />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Dialog>
      </Dialog.Root>
    </>
  );
}
