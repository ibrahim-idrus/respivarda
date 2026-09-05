import { escapeHtml } from "../telegram";

const CATEGORY_LABEL: Record<string, string> = {
  GOOD: "Baik",
  MODERATE: "Sedang",
  UNHEALTHY_SENSITIVE: "Tidak sehat bagi sensitif",
  UNHEALTHY: "Tidak sehat",
  VERY_UNHEALTHY: "Sangat tidak sehat",
  HAZARDOUS: "Berbahaya",
};
const CATEGORY_EMOJI: Record<string, string> = {
  GOOD: "🟢",
  MODERATE: "🟡",
  UNHEALTHY_SENSITIVE: "🟠",
  UNHEALTHY: "🔴",
  VERY_UNHEALTHY: "🟣",
  HAZARDOUS: "⚫",
};

export function formatDataAge(minutes: number): string {
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari ${hours % 24} jam lalu`;
}

export function formatAqiCard(opts: {
  city: string;
  usAqi: number;
  category: string;
  pollutant: string;
  isAlert: boolean;
  freshness: "FRESH" | "STALE" | "EXPIRED";
  dataAgeMinutes: number;
  medicalHistory: string[];
}): string {
  const { city, usAqi, category, pollutant, isAlert, freshness, dataAgeMinutes, medicalHistory } = opts;
  const emoji = CATEGORY_EMOJI[category] ?? "⚪";
  const label = CATEGORY_LABEL[category] ?? category;
  const lines = [
    isAlert ? "⚠️ <b>PERINGATAN KUALITAS UDARA</b> ⚠️" : `${emoji} <b>KUALITAS UDARA SAAT INI</b>`,
    "",
    `📍 Lokasi: <b>${escapeHtml(city)}</b>`,
    `🔢 AQI: <b>${usAqi}</b>`,
    `📊 Kategori: <b>${escapeHtml(label)}</b>`,
    `🏭 Polutan utama: <b>${escapeHtml(pollutant)}</b>`,
  ];
  if (freshness !== "FRESH") {
    lines.push("", `⏳ <i>Data terakhir ${formatDataAge(dataAgeMinutes)}, mungkin sudah tidak akurat.</i>`);
  }
  if (medicalHistory.length > 0) {
    lines.push("", `👤 <i>Dipersonalisasi untuk riwayat: ${escapeHtml(medicalHistory.join(", "))}</i>`);
  }
  return lines.join("\n");
}

export function formatRecommendationBlock(opts: {
  insight: string | null;
  recommendation: string | null;
  medicalHistory: string[];
}): string {
  const { insight, recommendation, medicalHistory } = opts;
  const recoSentences = (recommendation ?? "-")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const lines = [
    "💡 <b>Wawasan Udara</b>",
    `• <i>${escapeHtml(insight ?? "-")}</i>`,
    "",
    "🛡️ <b>Rekomendasi Untuk Anda</b>",
    ...recoSentences.map((s) => `• ${escapeHtml(s)}`),
  ];
  if (medicalHistory.length > 0) {
    lines.push(
      "",
      "━━━━━━━━━━━━",
      `🩺 <b>Personal untuk Anda</b> (riwayat: <i>${escapeHtml(medicalHistory.join(", "))}</i>)`
    );
  }
  return lines.join("\n");
}
