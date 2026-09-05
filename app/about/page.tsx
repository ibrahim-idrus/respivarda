import type { Metadata } from "next";
import AboutContent from "@/src/components/about/AboutContent";

export const metadata: Metadata = {
  title: "Tentang Respivarda",
  description:
    "Sistem pemantauan kualitas udara dan peringatan dini proaktif bertenaga AI untuk mengurangi risiko infeksi pernapasan.",
};

export default function AboutPage() {
  return <AboutContent />;
}
