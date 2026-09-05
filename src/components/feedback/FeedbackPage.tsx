"use client";

import { Broadcast, ShieldCheck } from "@phosphor-icons/react";
import Header from "../dashboard/Header";
import FeedbackForm from "./FeedbackForm";

// ponytail: reuses dashboard Header as-is — ceiling: header still shows
// "Dashboard" as active and a Set Location button that needs a modal handler.
// upgrade: lift Header to src/components/ with an `active` prop when a
// third page appears.
export default function FeedbackPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col pt-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-12 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Hero + privacy card */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-secondary">
                  <span className="h-2 w-2 rounded-full bg-secondary" />
                  Kanal Warga Langsung
                </span>
                <h1 className="text-[26px] sm:text-[32px] font-bold leading-[1.25] tracking-tight text-on-surface">Kirim Masukan untuk Admin</h1>
                <p className="text-sm leading-relaxed text-on-surface-variant">Bantu tingkatkan akurasi data AQI atau laporkan perbedaan bacaan di wilayahmu. Masukanmu langsung diteruskan ke tim Respivarda.</p>
              </div>

              <div className="flex flex-col gap-3 rounded-xl bg-surface-container-low p-6 shadow-sm">
                <div className="flex items-center gap-2 text-on-surface">
                  <ShieldCheck size={20} weight="fill" className="text-secondary" />
                  <span className="text-base font-semibold tracking-tight">Anonim &amp; Terbuka</span>
                </div>
                <p className="text-[13px] leading-[18px] text-on-surface-variant">Tanpa registrasi atau pelacakan. Catatanmu langsung diantrikan untuk verifikasi kalibrasi dan diagnosa sensor.</p>
                <div className="flex items-center gap-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  <Broadcast size={16} className="text-secondary" />
                  Diaudit oleh Inisiatif Lingkungan Terbuka
                </div>
              </div>
            </div>

            {/* Form card */}
            <div className="lg:col-span-8">
              <FeedbackForm />
            </div>
          </div>
        </div>
      </main>

    </>
  );
}
