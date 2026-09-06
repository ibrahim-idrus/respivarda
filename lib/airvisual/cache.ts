import { and, desc, eq } from "drizzle-orm";
import { db } from "@/src/db";
import { airQualityRecords, alertEvents, locations, users } from "@/src/db/schema";
import { evaluateRuleEngine } from "./rule-engine";
import { resolveAlertInsight } from "./alert-insight";
import { fetchNearestCity } from "./index";
import { MONITORED_LOCATIONS } from "./monitored-locations";
import type { NormalizedAirQuality, StaleResult, SuccessResult } from "./types";
import type { RuleEngineResult } from "./types";

export const CACHE_TTL_MINUTES = 60;
export const RELEVANCE_RADIUS_KM = 75;

export type CachedAqi = {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  usAqi: number;
  aqiCategory: NormalizedAirQuality["aqiCategory"];
  mainPollutant: string;
  measuredAt: Date;
  fetchedAt: Date;
  dataAgeMinutes: number;
  status: RuleEngineResult["status"];
  kind: "alert" | "insight" | "none";
  title: string | null;
  body: string | null;
  recommendation: string | null;
};

type LocationRow = typeof locations.$inferSelect;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

async function upsertMonitoredLocations(): Promise<LocationRow[]> {
  const rows: LocationRow[] = [];
  for (const loc of MONITORED_LOCATIONS) {
    const [row] = await db
      .insert(locations)
      .values({ city: loc.label ?? loc.id, state: loc.label ?? loc.id, country: "Indonesia", lat: loc.lat, lon: loc.lon, label: loc.label ?? loc.id })
      .onConflictDoNothing()
      .returning();
    if (row) {
      rows.push(row);
      continue;
    }
    const existing = await db
      .select()
      .from(locations)
      .where(
        and(
          eq(locations.city, loc.label ?? loc.id),
          eq(locations.state, loc.label ?? loc.id),
          eq(locations.country, "Indonesia")
        )
      )
      .limit(1);
    if (existing[0]) rows.push(existing[0]);
  }
  return rows;
}

function findNearestRow(lat: number, lon: number, rows: LocationRow[]): { row: LocationRow; distanceKm: number } | null {
  let best: LocationRow | null = null;
  let bestDist = Infinity;
  for (const row of rows) {
    const d = haversineKm(lat, lon, row.lat, row.lon);
    if (d < bestDist) {
      bestDist = d;
      best = row;
    }
  }
  return best ? { row: best, distanceKm: bestDist } : null;
}

async function upsertCityLocation(current: NormalizedAirQuality): Promise<LocationRow | null> {
  const [row] = await db
    .insert(locations)
    .values({ city: current.city, state: current.state, country: current.country, lat: current.latitude, lon: current.longitude, label: current.city })
    .onConflictDoNothing()
    .returning();
  if (row) return row;
  const existing = await db
    .select()
    .from(locations)
    .where(
      and(
        eq(locations.city, current.city),
        eq(locations.state, current.state),
        eq(locations.country, current.country)
      )
    )
    .limit(1);
  return existing[0] ?? null;
}

export async function nearestLocation(lat: number, lon: number): Promise<{ row: LocationRow; distanceKm: number } | null> {
  const rows = await upsertMonitoredLocations();
  return findNearestRow(lat, lon, rows);
}

export async function readCache(locationId: string, ttlMinutes = CACHE_TTL_MINUTES): Promise<CachedAqi | null> {
  const [record] = await db
    .select()
    .from(airQualityRecords)
    .where(eq(airQualityRecords.locationId, locationId))
    .orderBy(desc(airQualityRecords.fetchedAt))
    .limit(1);
  if (!record) return null;
  const ageMinutes = Math.floor((Date.now() - record.fetchedAt.getTime()) / 60_000);
  if (ageMinutes > ttlMinutes) return null;
  const [loc] = await db.select().from(locations).where(eq(locations.id, locationId)).limit(1);
  const [alert] = await db
    .select()
    .from(alertEvents)
    .where(eq(alertEvents.airQualityRecordId, record.id))
    .orderBy(desc(alertEvents.triggeredAt))
    .limit(1);
  return {
    city: loc?.city ?? "",
    state: loc?.state ?? "",
    country: loc?.country ?? "",
    latitude: loc?.lat ?? 0,
    longitude: loc?.lon ?? 0,
    usAqi: record.usAqi,
    aqiCategory: record.aqiCategory,
    mainPollutant: record.mainPollutant,
    measuredAt: record.measuredAt,
    fetchedAt: record.fetchedAt,
    dataAgeMinutes: record.dataAgeMinutes,
    status: record.respivardaStatus,
    kind: (alert?.kind as CachedAqi["kind"]) ?? "none",
    title: alert?.title ?? null,
    body: alert?.body ?? null,
    recommendation: alert?.recommendation ?? null,
  };
}

export async function getLocationIdByCity(city: string): Promise<string | null> {
  const allRows = await db.select().from(locations);
  const normalized = normalizeCityName(city);
  const match = allRows.find((r) => normalizeCityName(r.city) === normalized);
  return match?.id ?? null;
}
  const allRows = await db.select().from(locations);
  const out: CachedAqi[] = [];
  for (const loc of allRows) {
    const cached = await readCache(loc.id, Number.MAX_SAFE_INTEGER);
    if (!cached) continue;
    const ageMinutes = Math.floor((Date.now() - cached.fetchedAt.getTime()) / 60_000);
    if (ageMinutes > ttlMinutes) continue;
    out.push({ ...cached, dataAgeMinutes: Math.floor((Date.now() - cached.measuredAt.getTime()) / 60_000) });
  }
  return out;
}

async function writeRecord(
  locationId: string,
  current: NormalizedAirQuality,
  rule: RuleEngineResult,
  insight: { kind: "alert" | "insight" | "none"; title: string | null; body: string | null; recommendation: string | null },
  raw: unknown
): Promise<void> {
  const [latest] = await db
    .select()
    .from(airQualityRecords)
    .where(eq(airQualityRecords.locationId, locationId))
    .orderBy(desc(airQualityRecords.fetchedAt))
    .limit(1);
  if (
    latest &&
    latest.measuredAt.getTime() === current.measuredAt.getTime() &&
    latest.usAqi === current.usAqi &&
    latest.mainPollutant === current.mainPollutant
  ) {
    return;
  }
  const [record] = await db
    .insert(airQualityRecords)
    .values({
      locationId,
      measuredAt: current.measuredAt,
      usAqi: current.usAqi,
      mainPollutant: current.mainPollutant,
      aqiCategory: current.aqiCategory,
      respivardaStatus: rule.status,
      freshness: current.freshness,
      dataAgeMinutes: current.dataAgeMinutes,
      raw: raw as Record<string, unknown>,
    })
    .onConflictDoNothing()
    .returning();
  const recordId = record?.id
    ?? (
      await db
        .select({ id: airQualityRecords.id })
        .from(airQualityRecords)
        .where(
          and(
            eq(airQualityRecords.locationId, locationId),
            eq(airQualityRecords.measuredAt, current.measuredAt)
          )
        )
        .limit(1)
    )[0]?.id;
  if (!recordId) return;
  await db.insert(alertEvents).values({
    airQualityRecordId: recordId,
    locationId,
    status: rule.status,
    action: rule.action,
    severity: rule.severity,
    comparison: rule.comparison,
    persistent: rule.persistent,
    alertDecision: rule.alertDecision,
    reason: rule.reason,
    kind: insight.kind,
    title: insight.title,
    body: insight.body,
    recommendation: insight.recommendation,
  });
}

async function processFetchedData(
  locationId: string,
  r: SuccessResult | StaleResult,
  now: Date
): Promise<CachedAqi | null> {
  const current = r.data;
  const cached = await readCache(locationId, Number.MAX_SAFE_INTEGER);
  const previous: NormalizedAirQuality | null = cached
    ? {
        city: current.city,
        state: current.state,
        country: current.country,
        latitude: current.latitude,
        longitude: current.longitude,
        usAqi: cached.usAqi,
        aqiCategory: cached.aqiCategory,
        mainPollutant: cached.mainPollutant as NormalizedAirQuality["mainPollutant"],
        measuredAt: cached.measuredAt,
        dataAgeMinutes: cached.dataAgeMinutes,
        freshness: "FRESH",
      }
    : null;
  const rule = evaluateRuleEngine({ current, previous, now });
  const isStale = r.kind === "stale";
  const insight = isStale
    ? { kind: "none" as const, title: null, body: null, recommendation: null }
    : resolveAlertInsight(current, rule);
  await writeRecord(locationId, current, isStale ? { ...rule, alertDecision: "suppress", reason: "Stale: do not trigger new alert" } : rule, insight, r.raw);
  return readCache(locationId, Number.MAX_SAFE_INTEGER);
}

export async function refreshLocation(location: LocationRow, now = new Date()): Promise<CachedAqi | null> {
  let r: Awaited<ReturnType<typeof fetchNearestCity>>;
  try {
    r = await fetchNearestCity({ lat: location.lat, lon: location.lon }, { now });
  } catch (err) {
    console.error(`[cron] fetch ${location.city} threw:`, err instanceof Error ? err.message : "unknown");
    return readCache(location.id);
  }
  if (r.kind === "unavailable" || r.kind === "incomplete") {
    console.error(`[cron] fetch ${location.city} ${r.kind}:`, r.kind === "unavailable" ? r.error : (r.error ?? r.missingFields.join(", ")));
    return readCache(location.id);
  }
  return processFetchedData(location.id, r, now);
}

export async function refreshAllMonitored(now = new Date()): Promise<{ locationId: string; ok: boolean; cached: CachedAqi | null; error?: string }[]> {
  await upsertMonitoredLocations();
  const allRows = await db.select().from(locations);
  const results: { locationId: string; ok: boolean; cached: CachedAqi | null; error?: string }[] = [];
  for (const loc of allRows) {
    try {
      const cached = await refreshLocation(loc, now);
      results.push({ locationId: loc.id, ok: cached !== null, cached });
      if (!cached) {
        console.error(`[cron] refresh ${loc.city}: no data (API unavailable/incomplete, cache empty)`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown";
      console.error(`[cron] refresh ${loc.city} failed:`, message);
      const cached = await readCache(loc.id);
      results.push({ locationId: loc.id, ok: cached !== null, cached, error: message });
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return results;
}

async function fetchLiveForCoords(lat: number, lon: number, now = new Date()): Promise<{ location: LocationRow; current: NormalizedAirQuality; rule: RuleEngineResult; raw: unknown } | null> {
  let r: Awaited<ReturnType<typeof fetchNearestCity>>;
  try {
    r = await fetchNearestCity({ lat, lon }, { now });
  } catch {
    return null;
  }
  if (r.kind === "unavailable" || r.kind === "incomplete") return null;
  const current = r.data;
  const location = await upsertCityLocation(current);
  if (!location) return null;
  await processFetchedData(location.id, r, now);
  const rule = evaluateRuleEngine({ current, previous: null, now });
  return { location, current, rule, raw: r.raw };
}

export async function getAqiForCoords(lat: number, lon: number): Promise<{ cached: CachedAqi | null; locationId: string | null; distanceKm?: number }> {
  const nearest = await nearestLocation(lat, lon);
  if (nearest && nearest.distanceKm <= RELEVANCE_RADIUS_KM) {
    const cached = await readCache(nearest.row.id);
    if (cached) return { cached, locationId: nearest.row.id, distanceKm: nearest.distanceKm };
  }
  const live = await fetchLiveForCoords(lat, lon);
  if (!live) {
    if (nearest && nearest.distanceKm <= RELEVANCE_RADIUS_KM) {
      const cached = await readCache(nearest.row.id, Number.MAX_SAFE_INTEGER);
      return { cached, locationId: nearest.row.id, distanceKm: nearest.distanceKm };
    }
    return { cached: null, locationId: null };
  }
  const cached = await readCache(live.location.id, Number.MAX_SAFE_INTEGER);
  return { cached, locationId: live.location.id, distanceKm: nearest?.distanceKm };
}
