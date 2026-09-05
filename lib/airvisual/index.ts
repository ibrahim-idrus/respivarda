import axios from 'axios';
import type { GetNearestCityParams, NearestCityData, NearestCityPipelineResult, NearestCityResponse } from './types';
import { processAirQualityData } from './pipeline';

const airVisualApi = axios.create({
  baseURL: process.env.AIRVISUAL_API_URL ?? 'https://api.airvisual.com/v2',
  timeout: 10_000
});

function resolveApiKey(explicitKey?: string): string {
  const key = explicitKey ?? process.env.AIRVISUAL_API_KEY;
  if (!key) throw new Error('Missing AirVisual API key. Pass `key` or set AIRVISUAL_API_KEY');
  return key;
}

function assertCoordinates(lat: number, lon: number) {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new Error(`Invalid lat: ${lat}. Must be within [-90, 90]`);
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) throw new Error(`Invalid lon: ${lon}. Must be within [-180, 180]`);
}

function getMissingRequiredFields(raw: unknown): string[] {
  const missing: string[] = [];
  const r = raw as Record<string, unknown>;
  const data = r?.data as Record<string, unknown> | undefined;
  const location = data?.location as Record<string, unknown> | undefined;
  const current = data?.current as Record<string, unknown> | undefined;
  const pollution = current?.pollution as Record<string, unknown> | undefined;
  if (r?.status !== 'success') missing.push('status');
  if (typeof data?.city !== 'string' || !data.city.trim()) missing.push('data.city');
  if (typeof data?.state !== 'string' || !data.state.trim()) missing.push('data.state');
  if (typeof data?.country !== 'string' || !data.country.trim()) missing.push('data.country');
  const coords = location?.coordinates as unknown;
  if (!Array.isArray(coords) || coords.length !== 2 || !coords.every((n) => Number.isFinite(n as number))) {
    missing.push('data.location.coordinates');
  }
  if (typeof pollution?.ts !== 'string' || Number.isNaN(Date.parse(pollution.ts as string))) missing.push('current.pollution.ts');
  if (typeof pollution?.aqius !== 'number' || !Number.isFinite(pollution.aqius as number)) missing.push('current.pollution.aqius');
  if (typeof pollution?.mainus !== 'string' || !(pollution.mainus as string).trim()) missing.push('current.pollution.mainus');
  return missing;
}

export async function fetchNearestCity(
  params: GetNearestCityParams,
  opts?: { now?: Date }
): Promise<NearestCityPipelineResult> {
  assertCoordinates(params.lat, params.lon);
  const apiKey = resolveApiKey(params.key);
  let raw: unknown;
  try {
    const res = await airVisualApi.get<NearestCityResponse>('/nearest_city', {
      params: { lat: params.lat, lon: params.lon, key: apiKey }
    });
    raw = res.data;
  } catch (err: unknown) {
    const message = axios.isAxiosError(err)
      ? ((err.response?.data as { message?: string } | undefined)?.message ?? err.message ?? 'API request failed')
      : err instanceof Error
        ? err.message
        : 'API request failed';
    return { kind: 'unavailable', error: message, raw };
  }
  const typed = raw as NearestCityResponse;
  if (typed.status !== 'success') {
    const apiMessage = (typed as unknown as { message?: string })?.message ?? `API returned status: ${String(typed.status)}`;
    return { kind: 'unavailable', error: apiMessage, raw };
  }
  const missing = getMissingRequiredFields(raw);
  if (missing.length > 0) return { kind: 'incomplete', missingFields: missing, raw };
  try {
    const normalized = processAirQualityData(typed.data, opts?.now);
    if (normalized.freshness !== 'FRESH') return { kind: 'stale', data: normalized, raw };
    return { kind: 'success', data: normalized, raw };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Validation failed';
    return { kind: 'incomplete', missingFields: [], raw, error: message };
  }
}

export async function getNearestCity(params: GetNearestCityParams, opts?: { now?: Date }): Promise<NearestCityData> {
  const result = await fetchNearestCity(params, opts);
  if (result.kind === 'unavailable') throw new Error(result.error);
  if (result.kind === 'incomplete') {
    const detail = result.error ?? `Missing: ${result.missingFields.join(', ')}`;
    throw new Error(`Incomplete data. ${detail}`);
  }
  if (result.kind === 'stale') throw new Error(`Stale data: ${result.data.dataAgeMinutes} minutes old`);
  return result.raw as unknown as NearestCityData;
}

export async function getNearestCityRaw(params: GetNearestCityParams) {
  assertCoordinates(params.lat, params.lon);
  const apiKey = resolveApiKey(params.key);
  return airVisualApi.get<NearestCityResponse>('/nearest_city', {
    params: { lat: params.lat, lon: params.lon, key: apiKey }
  });
}

export { processAirQualityData } from './pipeline';
export { evaluateRuleEngine } from './rule-engine';
export { isAlertRequired, isInsightRequired, resolveAlertInsight } from './alert-insight';
export { buildHistoryPayload, storeHistory, getHistory, clearHistory } from './history';
export { MONITORED_LOCATIONS } from './monitored-locations';
export { fetchAndProcessAll } from './fetcher';
export * from './types';
export * from './pipeline';
export * from './rule-engine';
export * from './alert-insight';
export * from './history';
export * from './monitored-locations';
export * from './fetcher';
export default airVisualApi;
