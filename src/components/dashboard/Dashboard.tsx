"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Dialog, Button } from "@cloudflare/kumo";
import { CheckCircle, MapPin } from "@phosphor-icons/react";
import Header from "./Header";
import LocationBar from "./LocationBar";
import KaltimComparison from "./KaltimComparison";
import StatusPanel from "./StatusPanel";
import { DISTRICTS, SCENARIO_STYLES } from "@/src/lib/mock-data";
import type { District, Scenario } from "@/src/lib/mock-data";
import { useGeolocation } from "@/src/hooks/useGeolocation";
import { isInsideBalikpapan } from "@/src/lib/geo/balikpapan";
import { regionForPoint } from "@/src/lib/geo/kaltim";

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
  const [byCity, setByCity] = useState<Record<string, { city: string; usAqi: number; aqiCategory: string; mainPollutant?: string; freshness?: string }> | null>(null);
  const [kaltimLoading, setKaltimLoading] = useState(true);

  const selectScenario = (s: Scenario) => {
    const target = DISTRICTS.find((d) => d.id === DISTRICT_BY_SCENARIO[s]);
    if (target) setDistrict(target);
  };

  const useMyLocation = () => locate();

  useEffect(() => {
    setKaltimLoading(true);
    fetch("/api/air-quality?fetch=1")
      .then((r) => r.json())
      .then((j) => {
        const latest = j.data;
        if (latest?.airQualityRecord) setLiveAqi({ usAqi: latest.airQualityRecord.usAqi, category: latest.aqiCategory, city: latest.airQualityRecord.city, fetchedAt: latest.storedAt });
        if (j.byCity) {
          const mapped: Record<string, { city: string; usAqi: number; aqiCategory: string; mainPollutant?: string; freshness?: string }> = {};
          for (const [k, v] of Object.entries(j.byCity as Record<string, { airQualityRecord: { city: string; usAqi: number }; aqiCategory: string; alertEvent?: { status: string } }>)) {
            const h = v as unknown as { airQualityRecord: { city: string; usAqi: number; mainPollutant?: string; freshness?: string }; aqiCategory: string };
            mapped[k] = { city: h.airQualityRecord.city, usAqi: h.airQualityRecord.usAqi, aqiCategory: h.aqiCategory, mainPollutant: (h.airQualityRecord as { mainPollutant?: string }).mainPollutant, freshness: (h.airQualityRecord as { freshness?: string }).freshness };
          }
          setByCity(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setKaltimLoading(false));
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
              <p className="text-sm text-on-surface-variant">Kaltim live — Balikpapan • Samarinda • Penajam via nearest_city (hemat limit 3 fetch) • Arsiran = domisili Kaltim</p>
            </div>
            {liveAqi && (
              <div className="rounded-xl border border-surface-container bg-surface-container-lowest px-3 py-2 text-xs">
                <p className="font-bold flex items-center gap-1.5"><MapPin size={14} className="text-secondary" /> {liveAqi.city} • AQI {liveAqi.usAqi} {liveAqi.category}</p>
                <p className="text-on-surface-variant">Fetched {new Date(liveAqi.fetchedAt).toLocaleString("id-ID")}</p>
              </div>
            )}
          </div>
          {geoError && <p className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{geoError}</p>}
          {coords && (
            <p className="mb-3 rounded-xl border border-surface-container bg-white px-3 py-2 text-xs">
              Lokasi kamu: {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)} —{" "}
              {(() => {
                const r = regionForPoint(coords.lat, coords.lon);
                return r ? `Di dalam domisili ${r} (ter-cover stasiun Kaltim)` : "Di luar domisili Kaltim (data tetap nearest_city terdekat)";
              })()}
            </p>
          )}
          <SmokeMap district={district} userCoords={coords} />
        </section>

        <KaltimComparison byCity={byCity} loading={kaltimLoading} />
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
