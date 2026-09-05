"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";

const MAX_LEN = 1200;

type Kind = "saran" | "bug";

export default function FeedbackForm({ siteKey }: { siteKey: string }) {
  const [kind, setKind] = useState<Kind>("saran");
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const CATEGORY: Record<Kind, string> = {
    saran: "app_suggestion",
    bug: "app_bug",
  };

  useEffect(() => {
    if (!siteKey || document.getElementById("recaptcha-v3")) return;
    const s = document.createElement("script");
    s.id = "recaptcha-v3";
    s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    s.async = true;
    document.head.appendChild(s);
  }, [siteKey]);

  const submit = useMutation({
    mutationFn: async (input: { kind: Kind; description: string; captchaToken: string }) => {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: CATEGORY[input.kind],
          description: input.description,
          captchaToken: input.captchaToken,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Gagal mengirim");
      return res.json() as Promise<{ id: string; reportRef: string }>;
    },
    onSuccess: () => setSubmitted(true),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || submit.isPending) return;
    const g = (window as unknown as { grecaptcha?: { execute: (k: string, o: { action: string }) => Promise<string> } }).grecaptcha;
    if (!g) {
      submit.mutate({ kind, description: value.trim(), captchaToken: "" });
      return;
    }
    g.execute(siteKey, { action: "feedback_submit" })
      .then((token) => submit.mutate({ kind, description: value.trim(), captchaToken: token }))
      .catch(() => submit.mutate({ kind, description: value.trim(), captchaToken: "" }));
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

        <div className="flex flex-col items-end gap-2">
          {submit.isError && (
            <p className="text-xs font-medium text-error">
              Gagal mengirim masukan. Coba lagi.
            </p>
          )}
          <button
            type="submit"
            className="rounded-full bg-secondary px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#005a52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:opacity-40"
            disabled={!value.trim() || submit.isPending}
          >
            {submit.isPending ? "Mengirim…" : "Kirim masukan"}
          </button>
        </div>
      </form>
    </div>
  );
}
