"use client";

import Header from "../dashboard/Header";
import FeedbackForm from "./FeedbackForm";

export default function FeedbackPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col pt-16">
        <div className="mx-auto w-full max-w-xl px-4 sm:px-6 py-10">
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Saran dan Laporan Bug</h1>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Temukan bug atau punya saran untuk aplikasi Respivarda? Tulis di sini. Masukan bersifat anonim.
          </p>
          <div className="mt-6">
            <FeedbackForm />
          </div>
          <p className="mt-4 text-xs leading-5 text-on-surface-variant">
            Contoh: tombol peta tidak merespons di HP, atau usulan filter AQI per kecamatan.
          </p>
        </div>
      </main>
    </>
  );
}
