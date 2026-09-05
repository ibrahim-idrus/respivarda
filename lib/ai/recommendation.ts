import { z } from "zod";
import { getGeminiModel, hasGemini } from "@/lib/gemini";
import type { NormalizedAirQuality } from "@/lib/airvisual/types";
import type { RuleEngineResult } from "@/lib/airvisual/types";

export const recommendationSchema = z.object({
  insight: z.string().min(10),
  recommendation: z.string().min(10),
  risk_level: z.enum(["LOW", "MODERATE", "HIGH", "CRITICAL"]).optional(),
});

export type AIRecommendation = z.infer<typeof recommendationSchema>;

export type RecommendationInput = {
  current: NormalizedAirQuality;
  rule: RuleEngineResult;
  kind: "alert" | "insight" | "none";
  profile?: { age?: number | null; gender?: string | null; medicalHistory?: string[] | null } | null;
  healthLog?: { physicalActivity?: string | null; avgSleepHours?: number | string | null; symptoms?: string[] | null } | null;
};

function fallback(input: RecommendationInput): AIRecommendation {
  const { current, rule } = input;
  const riskMap: Record<string, AIRecommendation["risk_level"]> = {
    GOOD: "LOW",
    MODERATE: "MODERATE",
    UNHEALTHY_SENSITIVE: "MODERATE",
    UNHEALTHY: "HIGH",
    VERY_UNHEALTHY: "CRITICAL",
    HAZARDOUS: "CRITICAL",
  };
  const advices: Record<string, string> = {
    GOOD: "Kualitas udara baik. Aktivitas luar aman.",
    MODERATE: `Kualitas sedang. Polutan utama ${current.mainPollutant}. Kelompok sensitif kurangi aktivitas berat di luar.`,
    UNHEALTHY_SENSITIVE: `Kelompok sensitif batasi aktivitas luar. Polutan utama ${current.mainPollutant}. Gunakan masker di luar.`,
    UNHEALTHY: `Batasi aktivitas luar. Polutan utama ${current.mainPollutant}. Sensitif hindari aktivitas luar.`,
    VERY_UNHEALTHY: `Hindari aktivitas luar. Polutan utama ${current.mainPollutant}. Gunakan penyaring udara di dalam ruangan.`,
    HAZARDOUS: `Hindari aktivitas luar sepenuhnya. Polutan utama ${current.mainPollutant}. Tetap di ruangan tertutup.`,
  };
  return {
    insight: `${current.city}: AQI ${current.usAqi} (${rule.category}), polutan utama ${current.mainPollutant}. Status ${rule.status} — ${rule.reason}.`,
    recommendation: advices[rule.category] ?? advices.GOOD,
    risk_level: riskMap[rule.category] ?? "MODERATE",
  };
}

function buildPrompt(input: RecommendationInput): string {
  const { current, rule, kind, profile, healthLog } = input;
  const pipeline = `PIPELINE: IQAir nearest_city → Data Processing (validasi freshness/kelengkapan) → US AQI Processing → Threshold & Rule Engine (kategori ${rule.category}, status ${rule.status}, action ${rule.action}, severity ${rule.severity}, decision ${rule.alertDecision}, reason ${rule.reason}) → Alert & Insight Engine (kind ${kind}) → ${kind === "alert" ? "Proactive Alert" : kind === "insight" ? "Insight" : "No notification"} → Statistics/History`;
  return `Kamu adalah Respivarda. Hasilkan insight & preventive recommendation (bahasa Indonesia).

${pipeline}

DATA KUALITAS UDARA:
- Kota: ${current.city}, ${current.state}, ${current.country} (${current.latitude}, ${current.longitude})
- AQI US: ${current.usAqi} kategori ${current.aqiCategory}, freshness ${current.freshness}, measured_at ${current.measuredAt.toISOString()}
- Polutan utama: ${current.mainPollutant}

DATA PENGGUNA (opsional):
- Profil: usia ${profile?.age ?? "-"}, gender ${profile?.gender ?? "-"}, riwayat ${profile?.medicalHistory?.join(", ") || "-"}
- Health log: aktivitas ${healthLog?.physicalActivity ?? "-"}, tidur ${healthLog?.avgSleepHours ?? "-"} jam, gejala ${healthLog?.symptoms?.join(", ") || "-"}

TUGAS: keluarkan JSON { insight: string (1 kalimat), recommendation: string (2-4 kalimat preventif personal), risk_level: "LOW"|"MODERATE"|"HIGH"|"CRITICAL" }. Hanya JSON.`;
}

export async function generateRecommendation(input: RecommendationInput): Promise<AIRecommendation> {
  if (!hasGemini()) return fallback(input);
  try {
    const model = getGeminiModel();
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: buildPrompt(input) }] }],
    });
    const parsed = JSON.parse(result.response.text());
    return recommendationSchema.parse(parsed);
  } catch {
    return fallback(input);
  }
}

export async function generateAlertInsightRecommendation(params: {
  current: NormalizedAirQuality;
  rule: RuleEngineResult;
  profile?: RecommendationInput["profile"];
  healthLog?: RecommendationInput["healthLog"];
}): Promise<{ kind: "alert" | "insight" | "none"; insight: string | null; recommendation: string | null; ai: AIRecommendation | null }> {
  const kind: "alert" | "insight" | "none" =
    params.rule.alertDecision === "trigger" && params.rule.severity >= 2
      ? "alert"
      : params.rule.alertDecision === "trigger" && params.rule.severity === 1
        ? "insight"
        : "none";
  if (kind === "none") return { kind, insight: null, recommendation: null, ai: null };
  const ai = await generateRecommendation({ current: params.current, rule: params.rule, kind, profile: params.profile, healthLog: params.healthLog });
  return { kind, insight: ai.insight, recommendation: ai.recommendation, ai };
}
