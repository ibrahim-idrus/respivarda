"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";

const MAX_LEN = 1200;

type Kind = "saran" | "bug";

function genCaptcha() {
  const a = 2 + Math.floor(Math.random() * 8);
  const b = 2 + Math.floor(Math.random() * 8);
  return { a, b, ans: a + b };
}

export default function FeedbackForm() {
  const [kind, setKind] = useState<Kind>("saran");
  const [value, setValue] = useState("");
  const [captcha, setCaptcha] = useState(() => genCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaErr, setCaptchaErr] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // ponytail: public anonymous form only collects a free-text description.
  // ceiling: category hard-coded to app_suggestion (least-wrong bucket) and no
  // location/device capture. upgrade: add category picker + optional location
  // fields when the design calls for them.
  const submit = useMutation({
    mutationFn: async (description: string) => {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "app_suggestion", description }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Gagal mengirim");
      return res.json() as Promise<{ id: string; reportRef: string }>;
    },
    onSuccess: () => setSubmitted(true),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    if (Number(captchaInput) !== captcha.ans) {
      setCaptchaErr("Jawaban captcha salah. Coba lagi.");
      return;
    }
    setCaptchaErr("");
    setSubmitted(true);
  };

  const refreshCaptcha = () => {
    setCaptcha(genCaptcha());
    setCaptchaInput("");
    setCaptchaErr("");
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-outline-variant bg-white p-8 text-center">
        <p className="text-base font-semibold text-on-surface">Masukan terkirim</p>
        <p className="mt-1 text-sm leading-6 text-on-surface-variant">
          Terima kasih. Laporan {kind === "bug" ? "bug" : "saran"} sudah masuk antrean tim Respivarda.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setValue("");
              setCaptchaInput("");
              setCaptchaErr("");
              setCaptcha(genCaptcha());
              setSubmitted(false);
            }}
            className="rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#005a52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
          >
            Kirim lagi
          </button>
          <Link
            href="/"
            className="rounded-full border border-outline-variant bg-white px-5 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          >
            Kembali ke beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-outline-variant bg-white p-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-semibold text-on-surface">Jenis masukan</legend>
          <div className="flex gap-2">
            {(["saran", "bug"] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={kind === k}
                onClick={() => setKind(k)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
                  kind === k
                    ? "border-secondary bg-secondary-container text-on-secondary-container"
                    : "border-outline-variant bg-white text-on-surface hover:bg-surface-container-low"
                }`}
              >
                {k === "saran" ? "Saran" : "Bug"}
              </button>
            ))}
          </div>
          <p className="text-xs leading-5 text-on-surface-variant">
            {kind === "bug" ? "Jelaskan langkah untuk mereproduksi bug dan perangkat yang dipakai." : "Tulis usulan fitur atau perbaikan yang kamu harapkan."}
          </p>
        </fieldset>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor="catatan" className="text-sm font-semibold text-on-surface">
              Catatan <span className="font-normal text-error" aria-hidden>*</span>
            </label>
            <span className="text-xs tabular-nums text-on-surface-variant">
              {value.length} / {MAX_LEN}
            </span>
          </div>
          <textarea
            id="catatan"
            name="catatan"
            required
            rows={6}
            maxLength={MAX_LEN}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={kind === "bug" ? "Contoh: Di HP Android, peta tidak bisa di-zoom setelah membuka panel detail sensor." : "Contoh: Tambahkan filter AQI per kecamatan dan opsi bagikan tautan peta."}
            className="min-h-[148px] w-full resize-y rounded-xl border border-outline-variant bg-white px-3.5 py-3 text-sm leading-6 text-on-surface placeholder:text-on-surface-variant/60 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
          <p className="text-xs leading-5 text-on-surface-variant">Jangan sertakan data pribadi.</p>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label htmlFor="captcha" className="text-sm font-semibold text-on-surface">
              Captcha <span className="font-normal text-error" aria-hidden>*</span>
              <span className="ml-2 font-mono text-sm font-bold text-secondary">
                {captcha.a} + {captcha.b} = ?
              </span>
            </label>
            <button
              type="button"
              onClick={refreshCaptcha}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-on-surface ring-1 ring-outline-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            >
              Acak ulang
            </button>
          </div>
          <input
            id="captcha"
            name="captcha"
            required
            inputMode="numeric"
            pattern="[0-9]*"
            value={captchaInput}
            onChange={(e) => {
              setCaptchaInput(e.target.value.replace(/[^0-9]/g, ""));
              if (captchaErr) setCaptchaErr("");
            }}
            placeholder="Jawaban angka"
            className="h-10 w-full rounded-xl border border-outline-variant bg-white px-3.5 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 sm:max-w-[200px]"
          />
          {captchaErr ? <p className="text-xs font-medium text-error">{captchaErr}</p> : null}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-full bg-secondary px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#005a52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:opacity-40"
            disabled={!value.trim() || !captchaInput.trim()}
          >
            Kirim masukan
          </button>
        </div>
      </form>
    </div>
  );
}
