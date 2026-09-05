import { fetchNearestCity } from './index';
import { evaluateRuleEngine } from './rule-engine';
import { resolveAlertInsight } from './alert-insight';
import { buildHistoryPayload, getHistory, storeHistory } from './history';
import { MONITORED_LOCATIONS } from './monitored-locations';
import type { HistoryPayload } from './history';

export interface FetchAllOptions {
  now?: Date;
  locationIds?: string[];
}

export interface FetchAllResult {
  locationId: string;
  ok: boolean;
  payload?: HistoryPayload;
  error?: string;
}

export async function fetchAndProcessAll(opts: FetchAllOptions = {}): Promise<FetchAllResult[]> {
  const now = opts.now ?? new Date();
  const targets = opts.locationIds
    ? MONITORED_LOCATIONS.filter((l) => opts.locationIds!.includes(l.id))
    : MONITORED_LOCATIONS;

  const history = getHistory();
  const lastByLocation = new Map<string, HistoryPayload>();
  for (const h of history) {
    const key = `${h.airQualityRecord.city}-${h.airQualityRecord.state}`;
    if (!lastByLocation.has(key)) lastByLocation.set(key, h);
  }

  const results: FetchAllResult[] = [];

  for (const loc of targets) {
    const r = await fetchNearestCity({ lat: loc.lat, lon: loc.lon }, { now });

    if (r.kind === 'unavailable') {
      results.push({ locationId: loc.id, ok: false, error: r.error });
      continue;
    }
    if (r.kind === 'incomplete') {
      results.push({ locationId: loc.id, ok: false, error: r.error ?? `Missing: ${r.missingFields.join(', ')}` });
      continue;
    }

    const isStale = r.kind === 'stale';
    const current = r.data;

    const prevPayload = history.find((h) => h.airQualityRecord.city === current.city);
    const previous = prevPayload
      ? ({
          ...current,
          usAqi: prevPayload.airQualityRecord.usAqi,
          aqiCategory: prevPayload.aqiCategory as typeof current.aqiCategory,
          mainPollutant: prevPayload.mainPollutant as typeof current.mainPollutant,
          measuredAt: new Date(prevPayload.airQualityRecord.measuredAt)
        } as typeof current)
      : null;

    const rule = evaluateRuleEngine({ current, previous, now });

    if (isStale) {
      const payload = buildHistoryPayload(current, { ...rule, alertDecision: 'suppress', reason: 'Stale: do not trigger new alert' }, { kind: 'none', title: null, body: null, recommendation: null });
      storeHistory(payload);
      results.push({ locationId: loc.id, ok: true, payload });
      continue;
    }

    const insight = resolveAlertInsight(current, rule);
    const payload = buildHistoryPayload(current, rule, insight);
    storeHistory(payload);
    results.push({ locationId: loc.id, ok: true, payload });
  }

  return results;
}
