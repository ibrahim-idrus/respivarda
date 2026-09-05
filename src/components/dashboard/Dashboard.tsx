"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Dialog, Button } from "@cloudflare/kumo";
import { CheckCircle } from "@phosphor-icons/react";
import Header from "./Header";
import LocationBar from "./LocationBar";
import SurroundingDistricts from "./SurroundingDistricts";
import StatusPanel from "./StatusPanel";
import { DISTRICTS, SCENARIO_STYLES } from "@/src/lib/mock-data";
import type { District, Scenario } from "@/src/lib/mock-data";

// ponytail: in-memory state — ceiling: refresh resets scenario/district.
// upgrade: URL search param or localStorage.
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
  const [locating, setLocating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const selectScenario = (s: Scenario) => {
    const target = DISTRICTS.find((d) => d.id === DISTRICT_BY_SCENARIO[s]);
    if (target) setDistrict(target);
  };

  // ponytail: simulated sync — ceiling: fixed timeout, never touches
  // geolocation or network. upgrade: real fix + API sync.
  const useMyLocation = () => {
    setLocating(true);
    setTimeout(() => setLocating(false), 1800);
  };

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
          <div className="mb-4">
            <h2 className="text-xl font-extrabold tracking-tight">
              Regional Smoke Dispersion &amp; Proximity Map
            </h2>
            <p className="text-sm text-on-surface-variant">
              Balikpapan municipal live particulate drift and geographic radar
            </p>
          </div>
          <SmokeMap district={district} />
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
