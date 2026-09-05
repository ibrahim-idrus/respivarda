import type { NormalizedAirQuality } from './types';
import type { AlertInsightResult } from './alert-insight';
import type { RuleEngineResult } from './types';

export interface AirQualityRecord {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  usAqi: number;
  category: string;
  mainPollutant: string;
  measuredAt: string;
  freshness: string;
}

export interface HistoryPayload {
  airQualityRecord: AirQualityRecord;
  aqiCategory: string;
  mainPollutant: string;
  alertEvent: {
    status: string;
    action: string;
    kind: string;
    title: string | null;
    body: string | null;
    recommendation: string | null;
    reason: string;
  };
  storedAt: string;
}

const HISTORY: HistoryPayload[] = [];

export function buildHistoryPayload(
  current: NormalizedAirQuality,
  rule: RuleEngineResult,
  insight: AlertInsightResult
): HistoryPayload {
  return {
    airQualityRecord: {
      city: current.city,
      state: current.state,
      country: current.country,
      latitude: current.latitude,
      longitude: current.longitude,
      usAqi: current.usAqi,
      category: current.aqiCategory,
      mainPollutant: current.mainPollutant,
      measuredAt: current.measuredAt.toISOString(),
      freshness: current.freshness
    },
    aqiCategory: current.aqiCategory,
    mainPollutant: current.mainPollutant,
    alertEvent: {
      status: rule.status,
      action: rule.action,
      kind: insight.kind,
      title: insight.title,
      body: insight.body,
      recommendation: insight.recommendation,
      reason: rule.reason
    },
    storedAt: new Date().toISOString()
  };
}

export function storeHistory(payload: HistoryPayload): HistoryPayload {
  HISTORY.push(payload);
  return payload;
}

export function getHistory(): HistoryPayload[] {
  return [...HISTORY];
}

export function clearHistory(): void {
  HISTORY.length = 0;
}
