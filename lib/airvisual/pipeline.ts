import type {
  AqiCategory,
  DataFreshness,
  NearestCityData,
  NormalizedAirQuality,
  PollutantName
} from './types';
import { POLLUTANT_MAP } from './types';

export function validateAqi(aqi: unknown): number {
  if (typeof aqi !== 'number' || !Number.isFinite(aqi)) throw new Error('Invalid AQI value');
  if (aqi < 0 || aqi > 500) throw new Error(`AQI out of range: ${aqi}`);
  return aqi;
}

export function getAqiCategory(aqi: number): AqiCategory {
  if (aqi <= 50) return 'GOOD';
  if (aqi <= 100) return 'MODERATE';
  if (aqi <= 150) return 'UNHEALTHY_SENSITIVE';
  if (aqi <= 200) return 'UNHEALTHY';
  if (aqi <= 300) return 'VERY_UNHEALTHY';
  return 'HAZARDOUS';
}

export function mapPollutantCode(code: string): PollutantName {
  const pollutant = POLLUTANT_MAP[code as keyof typeof POLLUTANT_MAP];
  if (!pollutant) throw new Error(`Unsupported pollutant code: ${code}`);
  return pollutant;
}

export function validateTimestamp(timestamp: unknown): Date {
  if (typeof timestamp !== 'string') throw new Error('Invalid timestamp type');
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid timestamp: ${timestamp}`);
  return date;
}

export function validateLocation(location: { type: string; coordinates: unknown }) {
  if (location.type !== 'Point') throw new Error(`Unsupported location type: ${location.type}`);
  if (!Array.isArray(location.coordinates)) throw new Error('Invalid coordinates');
  if (location.coordinates.length !== 2) throw new Error('Point coordinates must contain [longitude, latitude]');
  const [longitude, latitude] = location.coordinates;
  if (typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error(`Invalid longitude: ${longitude}`);
  }
  if (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    throw new Error(`Invalid latitude: ${latitude}`);
  }
  return { longitude, latitude };
}

export function calculateDataAgeMinutes(measuredAt: Date, now = new Date()): number {
  const ageMs = now.getTime() - measuredAt.getTime();
  if (ageMs < 0) throw new Error('Measurement timestamp is in the future');
  return Math.floor(ageMs / 60_000);
}

export function getDataFreshness(ageMinutes: number): DataFreshness {
  if (ageMinutes <= 120) return 'FRESH';
  if (ageMinutes <= 180) return 'STALE';
  return 'EXPIRED';
}

export function processAirQualityData(data: NearestCityData, now = new Date()): NormalizedAirQuality {
  const usAqi = validateAqi(data.current.pollution.aqius);
  const mainPollutant = mapPollutantCode(data.current.pollution.mainus);
  const measuredAt = validateTimestamp(data.current.pollution.ts);
  const { latitude, longitude } = validateLocation(data.location);
  const dataAgeMinutes = calculateDataAgeMinutes(measuredAt, now);
  const freshness = getDataFreshness(dataAgeMinutes);
  const aqiCategory = getAqiCategory(usAqi);
  return {
    city: data.city,
    state: data.state,
    country: data.country,
    latitude,
    longitude,
    usAqi,
    aqiCategory,
    mainPollutant,
    measuredAt,
    dataAgeMinutes,
    freshness
  };
}
