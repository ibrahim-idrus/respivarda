export type AirVisualStatus = 'success' | 'fail';

export interface AirVisualPollution {
  ts: string;
  aqius: number;
  mainus: string;
  aqicn?: number;
  maincn?: string;
}

export interface AirVisualWeather {
  ts: string;
  ic: string;
  hu: number;
  pr: number;
  tp: number;
  wd: number;
  ws: number;
  heatIndex?: number;
}

export interface NearestCityData {
  city: string;
  state: string;
  country: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  current: {
    pollution: AirVisualPollution;
    weather?: AirVisualWeather;
  };
}

export interface NearestCityResponse {
  status: AirVisualStatus;
  data: NearestCityData;
}

export interface GetNearestCityParams {
  lat: number;
  lon: number;
  key?: string;
}

export const POLLUTANT_MAP = {
  p2: 'PM2.5',
  p1: 'PM10',
  o3: 'O3',
  n2: 'NO2',
  s2: 'SO2',
  co: 'CO'
} as const;

export type PollutantCode = keyof typeof POLLUTANT_MAP;
export type PollutantName = (typeof POLLUTANT_MAP)[PollutantCode];

export type DataFreshness = 'FRESH' | 'STALE' | 'EXPIRED';

export type AqiCategory =
  | 'GOOD'
  | 'MODERATE'
  | 'UNHEALTHY_SENSITIVE'
  | 'UNHEALTHY'
  | 'VERY_UNHEALTHY'
  | 'HAZARDOUS';

export interface NormalizedAirQuality {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  usAqi: number;
  aqiCategory: AqiCategory;
  mainPollutant: PollutantName;
  measuredAt: Date;
  dataAgeMinutes: number;
  freshness: DataFreshness;
}

export type RespivardaStatus = 'NORMAL' | 'CAUTION' | 'WARNING' | 'HIGH' | 'VERY_HIGH' | 'CRITICAL';
export type RespivardaAction =
  | 'Information'
  | 'Insight + Recommendation'
  | 'Proactive Alert'
  | 'Priority Alert'
  | 'High Priority Alert'
  | 'Critical Alert';

export interface RuleEngineInput {
  current: NormalizedAirQuality;
  previous?: NormalizedAirQuality | null;
  lastAlertAt?: Date | null;
  now?: Date;
  cooldownMinutes?: number;
}

export interface RuleEngineResult {
  status: RespivardaStatus;
  action: RespivardaAction;
  severity: number;
  category: AqiCategory;
  persistent: boolean;
  comparison: 'increased' | 'decreased' | 'no_change';
  alertDecision: 'trigger' | 'suppress';
  reason: string;
}

export interface UnavailableResult {
  kind: 'unavailable';
  error: string;
  raw?: unknown;
}

export interface IncompleteResult {
  kind: 'incomplete';
  missingFields: string[];
  raw: unknown;
  error?: string;
}

export interface StaleResult {
  kind: 'stale';
  data: NormalizedAirQuality;
  raw: unknown;
}

export interface SuccessResult {
  kind: 'success';
  data: NormalizedAirQuality;
  raw: unknown;
}

export type NearestCityPipelineResult = UnavailableResult | IncompleteResult | StaleResult | SuccessResult;
