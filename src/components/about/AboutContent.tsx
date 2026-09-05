"use client";

import Link from "next/link";
import Header from "@/src/components/dashboard/Header";
import {
  ArrowRight,
  BellRinging,
  Brain,
  ChartLineUp,
  ChatCenteredText,
  Database,
  Eye,
  FirstAid,
  Globe,
  Heartbeat,
  Lightbulb,
  MapPin,
  MapTrifold,
  ShieldPlus,
  Target,
  TelegramLogo,
  WhatsappLogo,
  Wind,
} from "@phosphor-icons/react";

const PILLARS = [
  {
    icon: Eye,
    title: "Pantau",
    text: "Pantau kondisi kualitas udara secara real-time.",
  },
  {
    icon: Lightbulb,
    title: "Pahami",
    text: "Bantu pengguna memahami tingkat pencemaran dan potensi risikonya.",
  },
  {
    icon: ShieldPlus,
    title: "Cegah",
    text: "Berikan informasi dan langkah pencegahan untuk mengurangi risiko paparan.",
  },
];

const WHY_FLOW = [
  {
    icon: Wind,
    title: "Masalah",
    text: "Pencemaran udara sering tidak terlihat, tetapi dapat memengaruhi kesehatan dari waktu ke waktu.",
  },
  {
    icon: ChartLineUp,
    title: "Informasi",
    text: "Data AQI diubah menjadi ringkasan kondisi, tingkat risiko, dan konteks.",
  },
  {
    icon: Target,
    title: "Aksi",
    text: "Pengguna tahu apa yang harus dilakukan: batasi paparan, pakai masker, atau tetap di dalam ruangan.",
  },
];

const STEPS = [
  {
    icon: Database,
    title: "Data Kualitas Udara",
    text: "IQAir / AirVisual API",
  },
  {
    icon: Eye,
    title: "Pemantauan",
    text: "Sistem memantau perubahan kualitas udara dan ambang batas yang telah ditentukan.",
  },
  {
    icon: ChartLineUp,
    title: "Analisis",
    text: "Sistem menentukan kategori kualitas udara dan kondisi risiko berdasarkan data yang tersedia.",
  },
  {
    icon: Brain,
    title: "Wawasan AI",
    text: "AI menghasilkan wawasan dan rekomendasi pencegahan berdasarkan kondisi pengguna dan konteks lingkungan.",
  },
  {
    icon: BellRinging,
    title: "Peringatan",
    text: "Pengguna menerima informasi, peringatan, dan rekomendasi melalui website, WhatsApp, atau Telegram.",
  },
];

const MISSIONS = [
  {
    icon: MapPin,
    title: "Kualitas udara lokal real-time",
    text: "Menyediakan informasi real-time tentang kualitas udara di sekitar pengguna, sehingga mereka dapat memahami apakah udara di wilayahnya baik, sedang, tidak sehat, atau sangat tidak sehat.",
  },
  {
    icon: Heartbeat,
    title: "Pencegahan yang dipersonalisasi",
    text: "Menyediakan edukasi dan panduan pencegahan yang dipersonalisasi berdasarkan lokasi pengguna, riwayat kesehatan, dan kebutuhan masing-masing, termasuk informasi tentang zat berbahaya dalam polutan, potensi risiko kesehatan, dan tindakan yang dapat dilakukan untuk mengurangi paparan.",
  },
  {
    icon: Wind,
    title: "Kesadaran pencemaran",
    text: "Meningkatkan kesadaran tentang sumber dan pola pencemaran udara yang memengaruhi wilayah pengguna serta memberikan informasi tentang potensi penyebaran polusi, sehingga masyarakat dapat tetap waspada dan mengambil langkah pencegahan sebelum kondisi memburuk.",
  },
];

const TECH = [
  {
    icon: Database,
    title: "IQAir / AirVisual API",
    text: "Digunakan sebagai sumber utama data kualitas udara.",
  },
  {
    icon: Brain,
    title: "Kecerdasan Buatan",
    text: "Digunakan untuk menghasilkan wawasan dan rekomendasi pencegahan.",
  },
  {
    icon: MapTrifold,
    title: "Leaflet",
    text: "Digunakan untuk memvisualisasikan lokasi dan informasi kualitas udara pada peta.",
  },
  {
    icon: TelegramLogo,
    title: "Telegram",
    text: "Digunakan sebagai salah satu kanal komunikasi untuk menerima informasi dan rekomendasi.",
  },
  {
    icon: WhatsappLogo,
    title: "WhatsApp",
    text: "Digunakan sebagai salah satu kanal komunikasi Respivarda.",
  },
];

const CHANNELS = [
  {
    icon: Globe,
    title: "Website",
    text: "Untuk melihat kondisi kualitas udara, peta, dan informasi terkait.",
  },
  {
    icon: TelegramLogo,
    title: "Telegram",
    text: "Untuk menerima informasi berbasis lokasi, peringatan, dan rekomendasi.",
  },
  {
    icon: WhatsappLogo,
    title: "WhatsApp",
    text: "Untuk mengakses informasi Respivarda melalui layanan bot.",
  },
];

const HERO_VISUAL = [
  { icon: Wind, label: "Kualitas udara" },
  { icon: MapPin, label: "Lokasi" },
  { icon: Eye, label: "Pemantauan" },
  { icon: Brain, label: "AI" },
  { icon: BellRinging, label: "Peringatan" },
];

export default function AboutContent() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col pt-16">
        <section className="mx-auto w-full max-w-7xl px-4 pt-12 sm:px-6 sm:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-secondary">
                Tentang Respivarda
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
                Sistem Pemantauan Kualitas Udara dan Peringatan Dini Proaktif Bertenaga AI untuk
                Mengurangi Risiko Infeksi Pernapasan
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-on-surface-variant sm:text-base sm:leading-7">
                Respivarda membantu masyarakat memahami kualitas udara di sekitar mereka,
                meningkatkan kesadaran terhadap pencemaran udara, serta menerima informasi
                pencegahan berdasarkan kondisi lingkungan dan kebutuhan masing-masing.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#005a52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
                >
                  Cek Kualitas Udara
                  <ArrowRight size={16} weight="bold" />
                </Link>
                <Link
                  href="/feedback"
                  className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-white px-6 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                >
                  Kirim Masukan
                </Link>
              </div>
            </div>
            <div
              aria-label="Kualitas udara, lokasi, pemantauan, AI, dan peringatan"
              className="grid grid-cols-2 gap-3 sm:grid-cols-3"
            >
              {HERO_VISUAL.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-surface-container bg-surface-container-lowest p-5 text-center shadow-sm"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
                    <Icon size={22} weight="fill" aria-hidden />
                  </span>
                  <p className="text-xs font-bold text-on-surface">{label}</p>
                </div>
              ))}
              <div className="col-span-2 flex items-center justify-between gap-2 rounded-2xl bg-primary px-5 py-4 text-white sm:col-span-1">
                <div>
                  <p className="text-2xl font-extrabold">AQI</p>
                  <p className="text-xs font-medium text-slate-300">Indikator langsung</p>
                </div>
                <span className="h-3 w-3 rounded-full bg-emerald-400" aria-hidden />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pt-16 sm:px-6">
          <h2 className="text-xl font-extrabold tracking-tight text-on-surface sm:text-2xl">
            Apa itu Respivarda?
          </h2>
          <div className="mt-4 max-w-3xl space-y-4 text-sm leading-6 text-on-surface-variant sm:text-base sm:leading-7">
            <p>
              Respivarda adalah sistem pemantauan kualitas udara yang menggunakan IQAir API
              sebagai sumber utama data AQI untuk memantau kondisi kualitas udara di berbagai
              wilayah.
            </p>
            <p>
              Sistem ini menyediakan informasi kualitas udara secara real-time dan membantu
              pengguna memahami tingkat risiko berdasarkan kualitas udara di sekitar lokasi
              mereka.
            </p>
            <p>
              Respivarda juga memberikan panduan dan rekomendasi pencegahan yang dapat
              dipersonalisasi berdasarkan kondisi kualitas udara, lokasi pengguna, dan kebutuhan
              masing-masing untuk membantu mengurangi risiko kesehatan akibat paparan udara yang
              tidak sehat, khususnya infeksi pernapasan.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {PILLARS.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-2xl border border-surface-container bg-surface-container-lowest p-6 shadow-sm"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
                  <Icon size={22} weight="fill" aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-extrabold text-on-surface">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-on-surface-variant">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pt-16 sm:px-6">
          <h2 className="text-xl font-extrabold tracking-tight text-on-surface sm:text-2xl">
            Mengapa Respivarda Dibuat?
          </h2>
          <div className="mt-4 max-w-3xl space-y-4 text-sm leading-6 text-on-surface-variant sm:text-base sm:leading-7">
            <p>
              Pencemaran udara tidak selalu terlihat tetapi dapat berdampak pada kesehatan
              masyarakat. Pencemaran udara dapat berubah dari waktu ke waktu dan berbeda di
              setiap lokasi. Hal ini menciptakan kebutuhan akan informasi yang mudah diakses
              untuk membantu masyarakat memahami kualitas udara di sekitar mereka.
            </p>
            <p>
              Respivarda dibuat untuk menjembatani kesenjangan antara data kualitas udara dan
              informasi yang mudah dipahami masyarakat. Pengguna tidak hanya perlu mengetahui
              nilai AQI, tetapi juga memahami kondisi saat ini, potensi risiko, dan langkah
              pencegahan yang dapat dilakukan.
            </p>
          </div>
          <ol className="mt-8 grid gap-4 sm:grid-cols-3">
            {WHY_FLOW.map(({ icon: Icon, title, text }, i) => (
              <li
                key={title}
                className="rounded-2xl border border-surface-container bg-surface-container-lowest p-6 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">
                  {i + 1}. {title}
                </p>
                <span className="mt-3 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
                  <Icon size={22} weight="fill" aria-hidden />
                </span>
                <p className="mt-3 text-sm leading-6 text-on-surface-variant">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pt-16 sm:px-6">
          <h2 className="text-xl font-extrabold tracking-tight text-on-surface sm:text-2xl">
            Bagaimana Respivarda Bekerja?
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant sm:text-base sm:leading-7">
            Dari data sensor mentah menjadi panduan yang bisa ditindaklanjuti.
          </p>
          <ol className="mt-8 grid gap-4 md:grid-cols-5">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li
                key={title}
                className="rounded-2xl border border-surface-container bg-surface-container-lowest p-5 shadow-sm"
              >
                <p className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-extrabold text-white">
                  {i + 1}
                </p>
                <Icon size={24} weight="fill" aria-hidden className="mt-4 text-secondary" />
                <h3 className="mt-2 text-sm font-extrabold text-on-surface">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-on-surface-variant sm:text-sm sm:leading-6">
                  {text}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pt-16 sm:px-6">
          <div className="rounded-2xl bg-primary px-6 py-10 text-center text-white sm:px-12 sm:py-14">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-secondary-fixed">
              <FirstAid size={18} weight="fill" aria-hidden />
              Visi
            </p>
            <blockquote className="mx-auto mt-4 max-w-3xl text-xl font-extrabold leading-8 tracking-tight sm:text-2xl sm:leading-10">
              Mewujudkan masyarakat yang sadar pencemaran lingkungan serta teredukasi tentang
              pencegahan dan pertolongan pertama infeksi pernapasan.
            </blockquote>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pt-16 sm:px-6">
          <h2 className="text-xl font-extrabold tracking-tight text-on-surface sm:text-2xl">
            Misi Kami
          </h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {MISSIONS.map(({ icon: Icon, title, text }, i) => (
              <article
                key={title}
                className="flex flex-col rounded-2xl border border-surface-container bg-surface-container-lowest p-6 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
                    <Icon size={22} weight="fill" aria-hidden />
                  </span>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-secondary">
                    Misi {i + 1}
                  </p>
                </div>
                <h3 className="mt-4 text-base font-extrabold text-on-surface">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pt-16 sm:px-6">
          <h2 className="text-xl font-extrabold tracking-tight text-on-surface sm:text-2xl">
            Teknologi di Balik Respivarda
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TECH.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="flex gap-4 rounded-2xl border border-surface-container bg-surface-container-lowest p-5 shadow-sm"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
                  <Icon size={22} weight="fill" aria-hidden />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-on-surface">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pt-16 sm:px-6">
          <h2 className="text-xl font-extrabold tracking-tight text-on-surface sm:text-2xl">
            Informasi di Mana Pun Anda Berada
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {CHANNELS.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-2xl border border-surface-container bg-surface-container-lowest p-6 text-center shadow-sm"
              >
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                  <Icon size={24} weight="fill" aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-extrabold text-on-surface">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-on-surface-variant">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
          <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-8 text-center shadow-sm sm:p-12">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-secondary">
              <ChatCenteredText size={18} weight="fill" aria-hidden />
              Mulai
            </p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">
              Kenali Udara di Sekitarmu
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-on-surface-variant sm:text-base sm:leading-7">
              Pantau kualitas udara, pahami risikonya, dan lakukan langkah pencegahan untuk
              melindungi kesehatanmu.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#005a52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
              >
                Cek Kualitas Udara
                <ArrowRight size={16} weight="bold" />
              </Link>
              <Link
                href="/feedback"
                className="inline-flex items-center rounded-full border border-outline-variant bg-white px-6 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                Kirim Masukan
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
