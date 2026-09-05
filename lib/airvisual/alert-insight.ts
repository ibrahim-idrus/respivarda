import type { AqiCategory, NormalizedAirQuality, PollutantName } from './types';
import type { RuleEngineResult } from './types';

export type AlertKind = 'alert' | 'insight' | 'none';

export interface AlertInsightResult {
  kind: AlertKind;
  title: string | null;
  body: string | null;
  recommendation: string | null;
}

function recommendationFor(category: AqiCategory, pollutant: PollutantName): string {
  switch (category) {
    case 'GOOD':
      return 'Kualitas udara baik. Aktivitas luar ruangan aman.';
    case 'MODERATE':
      return `Kualitas udara sedang. Polutan utama ${pollutant}. Kelompok sensitif kurangi aktivitas berat di luar.`;
    case 'UNHEALTHY_SENSITIVE':
      return `Kelompok sensitif batasi aktivitas luar. Polutan utama ${pollutant}. Gunakan masker saat di luar.`;
    case 'UNHEALTHY':
      return `Batasi aktivitas luar. Polutan utama ${pollutant}. Kelompok sensitif hindari aktivitas luar.`;
    case 'VERY_UNHEALTHY':
      return `Hindari aktivitas luar. Polutan utama ${pollutant}. Gunakan penyaring udara di dalam ruangan.`;
    case 'HAZARDOUS':
      return `Hindari aktivitas luar sepenuhnya. Polutan utama ${pollutant}. Tetap di ruangan tertutup.`;
  }
}

function alertBodyFor(category: AqiCategory, aqi: number, pollutant: PollutantName, city: string): string {
  return `${city}: AQI ${aqi} (${category}), polutan utama ${pollutant}.`;
}

function insightBodyFor(category: AqiCategory, aqi: number, pollutant: PollutantName): string {
  return `AQI ${aqi} (${category}), polutan utama ${pollutant}.`;
}

export function isAlertRequired(rule: RuleEngineResult): boolean {
  return rule.alertDecision === 'trigger' && rule.severity >= 2;
}

export function isInsightRequired(rule: RuleEngineResult): boolean {
  return rule.alertDecision === 'trigger' && rule.severity === 1;
}

export function resolveAlertInsight(current: NormalizedAirQuality, rule: RuleEngineResult): AlertInsightResult {
  if (isAlertRequired(rule)) {
    return {
      kind: 'alert',
      title: rule.action,
      body: alertBodyFor(rule.category, current.usAqi, current.mainPollutant, current.city),
      recommendation: recommendationFor(rule.category, current.mainPollutant)
    };
  }
  if (isInsightRequired(rule)) {
    return {
      kind: 'insight',
      title: rule.action,
      body: insightBodyFor(rule.category, current.usAqi, current.mainPollutant),
      recommendation: recommendationFor(rule.category, current.mainPollutant)
    };
  }
  return { kind: 'none', title: null, body: null, recommendation: null };
}

export async function resolveAlertInsightWithAI(
  current: NormalizedAirQuality,
  rule: RuleEngineResult,
  opts?: { profile?: { age?: number | null; gender?: string | null; medicalHistory?: string[] | null } | null }
): Promise<AlertInsightResult> {
  const base = resolveAlertInsight(current, rule);
  if (base.kind === 'none') return base;
  const { generateRecommendation } = await import('@/lib/ai/recommendation');
  const ai = await generateRecommendation({ current, rule, kind: base.kind, profile: opts?.profile });
  return { kind: base.kind, title: base.title, body: ai.insight, recommendation: ai.recommendation };
}
