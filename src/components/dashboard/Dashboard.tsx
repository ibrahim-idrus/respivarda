"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Crosshair, MapPin } from "@phosphor-icons/react";
import Header from "./Header";
import KaltimComparison from "./KaltimComparison";
import TelegramConnect from "./TelegramConnect";
import { useGeolocation } from "@/src/hooks/useGeolocation";
import { regionForPoint } from "@/src/lib/geo/kaltim";

const SmokeMap = dynamic(() => import("./SmokeMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] items-center justify-center rounded-2xl border border-surface-container bg-surface-container-low text-sm text-on-surface-variant sm:h-[480px] lg:h-[560px]">
      Loading map…
    </div>
  ),
});

type CityEntry = { city: string; usAqi: number; aqiCategory: string; mainPollutant?: string; lat?: number; lon?: number; fetchedAt?: string };

export default function Dashboard() {
  const { coords, loading: geoLoading, error: geoError, locate } = useGeolocation();
  const [liveAqi, setLiveAqi] = useState<{ usAqi: number; category: string; city: string; fetchedAt: string } | null>(null);
  const [byCity, setByCity] = useState<Record<string, CityEntry> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [myAqi, setMyAqi] = useState<CityEntry | null>(null);
  const [myAqiLoading, setMyAqiLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/air-quality?fetch=1")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) {
          if (!cancelled) setFetchError(j?.error ?? "Gagal memuat data kualitas udara.");
          return;
        }
        const latest = j.data;
        if (latest?.city && !cancelled) {
          setLiveAqi({ usAqi: latest.usAqi, category: latest.aqiCategory, city: latest.city, fetchedAt: latest.fetchedAt });
        }
        if (j.byCity) {
          const mapped: Record<string, CityEntry> = {};
          for (const [k, v] of Object.entries(j.byCity as Record<string, { city: string; usAqi: number; latitude?: number; longitude?: number; mainPollutant?: string; aqiCategory: string; fetchedAt?: string }>)) {
            const h = v as unknown as { city: string; usAqi: number; latitude?: number; longitude?: number; mainPollutant?: string; aqiCategory: string; fetchedAt?: string };
            mapped[k] = {
              city: h.city,
              usAqi: h.usAqi,
              aqiCategory: h.aqiCategory,
              mainPollutant: h.mainPollutant,
              lat: h.latitude,
              lon: h.longitude,
              fetchedAt: h.fetchedAt,
            };
          }
          if (!cancelled) {
            setByCity(mapped);
            const first = Object.keys(mapped)[0] ?? null;
            setSelectedKey((prev) => prev ?? first);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setFetchError("Gagal memuat data kualitas udara. Coba muat ulang.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const selected = useMemo(() => (selectedKey && byCity?.[selectedKey] ? byCity[selectedKey] : null), [byCity, selectedKey]);
  const headerAqi = useMemo(() => {
    if (myAqi) return { city: myAqi.city, usAqi: myAqi.usAqi, category: myAqi.aqiCategory, fetchedAt: myAqi.fetchedAt ?? liveAqi?.fetchedAt ?? null };
    if (selected?.fetchedAt) return { city: selected.city, usAqi: selected.usAqi, category: selected.aqiCategory, fetchedAt: selected.fetchedAt };
    if (selected) return { city: selected.city, usAqi: selected.usAqi, category: selected.aqiCategory, fetchedAt: liveAqi?.fetchedAt ?? null };
    return liveAqi;
  }, [selected, liveAqi, myAqi]);

  const handleMyLocation = useCallback(() => {
    setMyAqiLoading(true);
    locate();
  }, [locate]);

  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    fetch(`/api/air-quality/nearest?lat=${coords.lat}&lon=${coords.lon}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok || !j?.data || cancelled) return;
        const d = j.data;
        setMyAqi({
          city: d.city,
          usAqi: d.usAqi,
          aqiCategory: d.aqiCategory,
          mainPollutant: d.mainPollutant,
          lat: d.latitude,
          lon: d.longitude,
          fetchedAt: d.fetchedAt,
        });
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setMyAqiLoading(false); });
    return () => { cancelled = true; };
  }, [coords]);

  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col gap-8 pb-16">
        <section className="mx-auto w-full max-w-7xl px-4 pt-24 sm:px-6">
          <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold">
                  {myAqi ? `Lokasi saya: ${myAqi.city} • AQI ${myAqi.usAqi} ${myAqi.aqiCategory.replaceAll("_", " ")}` : selected ? `Lokasi terpilih: ${selected.city} • AQI ${selected.usAqi}` : "Memuat lokasi pantau"}
                </p>
                <p className="text-xs text-on-surface-variant">
                  {myAqi ? `Polutan utama ${myAqi.mainPollutant ?? "—"} • Data dari stasiun terdekat posisimu` : "Data dari stasiun terdekat via IQAir. Pilih kartu perbandingan untuk fokus di peta."}
                </p>
                {coords && (
                  <p className="mt-2 text-xs text-on-surface-variant">
                    Lokasi kamu: {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}
                    {(() => {
                      const r = regionForPoint(coords.lat, coords.lon);
                      return r ? ` • Cakupan ${r}` : "";
                    })()}
                  </p>
                )}
                {geoError && <p className="mt-2 text-xs font-semibold text-rose-700">{geoError}</p>}
                {fetchError && <p className="mt-2 text-xs font-semibold text-amber-700">{fetchError}</p>}
              </div>
              <button
                onClick={handleMyLocation}
                disabled={geoLoading || myAqiLoading}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-secondary bg-secondary px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-secondary/90 disabled:opacity-60"
              >
                <Crosshair size={14} weight="bold" />
                {geoLoading || myAqiLoading ? "Memuat..." : myAqi ? "Perbarui lokasi saya" : "Gunakan lokasi saya"}
              </button>
            </div>
            {myAqi && (
              <button onClick={() => setMyAqi(null)} className="mt-3 text-xs font-semibold text-secondary underline underline-offset-2">
                Kembali ke kota terpilih
              </button>
            )}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Peta Kualitas Udara</h2>
              <p className="text-sm text-on-surface-variant">Data AQI dari stasiun terdekat. Arsiran menandai cakupan wilayah tiap stasiun.</p>
            </div>
            {headerAqi?.fetchedAt && (
              <div className="rounded-xl border border-surface-container bg-surface-container-lowest px-3 py-2 text-xs">
                <p className="font-bold flex items-center gap-1.5"><MapPin size={14} className="text-secondary" /> {headerAqi.city} • AQI {headerAqi.usAqi} {headerAqi.category}</p>
                <p className="text-on-surface-variant">Diperbarui {new Date(headerAqi.fetchedAt).toLocaleString("id-ID")}</p>
              </div>
            )}
          </div>
          <SmokeMap selectedKey={selectedKey} byCity={byCity} userCoords={coords} myLocation={myAqi ? { lat: myAqi.lat!, lon: myAqi.lon!, city: myAqi.city, aqiCategory: myAqi.aqiCategory } : null} />
        </section>

        <KaltimComparison byCity={byCity} loading={loading} selectedKey={selectedKey} onSelect={setSelectedKey} />

        <TelegramConnect />

        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="rounded-2xl border p-6 text-sm text-on-surface-variant">
            <p className="mb-1 font-extrabold text-on-surface">Tentang Respivarda</p>
            Respivarda memantau kualitas udara dan memberi peringatan proaktif untuk mengurangi risiko ISPA. Sistem memakai data AQI dari IQAir, mengirim peringatan saat melewati ambang yang kamu atur, lalu menghasilkan insight dan rekomendasi yang relevan dengan kondisi saat itu. Pantau lewat website, dan dapatkan peringatan lewat bot WhatsApp dan Telegram.
          </div>
        </section>
      </main>
    </>
  );
}
