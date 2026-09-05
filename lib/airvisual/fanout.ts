import { desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/src/db";
import {
  alertEvents,
  healthLogs,
  notificationDeliveries,
  personalizedInsights,
  userProfiles,
  users,
} from "@/src/db/schema";
import { evaluateRuleEngine } from "@/lib/airvisual/rule-engine";
import type { CachedAqi } from "@/lib/airvisual/cache";
import { RELEVANCE_RADIUS_KM } from "@/lib/airvisual/cache";
import { generateRecommendation } from "@/lib/ai/recommendation";
import { formatAqiCard, formatRecommendationBlock } from "@/lib/telegram/format";
import { sendTelegramMessage } from "@/lib/telegram";
import type { NormalizedAirQuality } from "@/lib/airvisual/types";

const ALERT_COOLDOWN_MINUTES = 60;

type UserRow = typeof users.$inferSelect;

function coordsToNormalized(cached: CachedAqi): NormalizedAirQuality {
  return {
    city: cached.city,
    state: cached.state,
    country: cached.country,
    latitude: cached.latitude,
    longitude: cached.longitude,
    usAqi: cached.usAqi,
    aqiCategory: cached.aqiCategory,
    mainPollutant: cached.mainPollutant as NormalizedAirQuality["mainPollutant"],
    measuredAt: cached.measuredAt,
    dataAgeMinutes: cached.dataAgeMinutes,
    freshness: cached.dataAgeMinutes <= 120 ? "FRESH" : cached.dataAgeMinutes <= 180 ? "STALE" : "EXPIRED",
  };
}

async function lastAlertAt(userId: string, locationId: string): Promise<Date | null> {
  const [row] = await db
    .select({ sentAt: notificationDeliveries.sentAt, createdAt: notificationDeliveries.createdAt })
    .from(notificationDeliveries)
    .where(eq(notificationDeliveries.userId, userId))
    .orderBy(desc(notificationDeliveries.createdAt))
    .limit(1);
  void locationId;
  return row?.sentAt ?? row?.createdAt ?? null;
}

export type FanoutResult = {
  locationId: string;
  city: string;
  triggered: boolean;
  sent: number;
  skipped: number;
  errors: string[];
};

export async function fanoutLocationAlert(
  locationId: string,
  cached: CachedAqi,
  now = new Date()
): Promise<FanoutResult> {
  const base: FanoutResult = { locationId, city: cached.city, triggered: false, sent: 0, skipped: 0, errors: [] };
  if (cached.dataAgeMinutes > 180) return base;

  const candidates = await db.select().from(users).where(isNotNull(users.telegramChatId));

  const result = base;
  for (const user of candidates as UserRow[]) {
    if (user.latitude == null || user.longitude == null || !user.telegramChatId) {
      result.skipped += 1;
      continue;
    }
    const dLat = ((cached.latitude - user.latitude) * Math.PI) / 180;
    const dLon = ((cached.longitude - user.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((user.latitude * Math.PI) / 180) *
        Math.cos((cached.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const distKm = 2 * 6371 * Math.asin(Math.sqrt(a));
    if (distKm > RELEVANCE_RADIUS_KM) {
      result.skipped += 1;
      continue;
    }

    const current = coordsToNormalized(cached);
    const rule = evaluateRuleEngine({
      current,
      previous: null,
      lastAlertAt: await lastAlertAt(user.id, locationId),
      now,
      cooldownMinutes: ALERT_COOLDOWN_MINUTES,
    });
    if (rule.alertDecision !== "trigger" || rule.severity < 2) {
      result.skipped += 1;
      continue;
    }
    result.triggered = true;

    const [profile] = await db
      .select({ age: userProfiles.age, gender: userProfiles.gender, medicalHistory: userProfiles.medicalHistory })
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1);
    const [healthLog] = await db
      .select({
        physicalActivity: healthLogs.physicalActivity,
        avgSleepHours: healthLogs.avgSleepHours,
        symptoms: healthLogs.symptoms,
      })
      .from(healthLogs)
      .where(eq(healthLogs.userId, user.id))
      .orderBy(desc(healthLogs.loggedAt))
      .limit(1);

    const ai = await generateRecommendation({
      current,
      rule,
      kind: "alert",
      profile: profile ?? null,
      healthLog: healthLog ?? null,
    });

    const [alertEvent] = await db
      .select({ id: alertEvents.id })
      .from(alertEvents)
      .where(eq(alertEvents.locationId, locationId))
      .orderBy(desc(alertEvents.triggeredAt))
      .limit(1);
    if (!alertEvent) {
      result.skipped += 1;
      continue;
    }

    let insightId: string | null = null;
    try {
      const [insight] = await db
        .insert(personalizedInsights)
        .values({
          userId: user.id,
          alertEventId: alertEvent.id,
          recommendation: ai.recommendation,
          context: { insight: ai.insight, riskLevel: ai.risk_level ?? null, usAqi: cached.usAqi },
        })
        .onConflictDoNothing()
        .returning({ id: personalizedInsights.id });
      insightId = insight?.id ?? null;
      if (!insightId) {
        const [existing] = await db
          .select({ id: personalizedInsights.id })
          .from(personalizedInsights)
          .where(eq(personalizedInsights.alertEventId, alertEvent.id))
          .limit(1);
        insightId = existing?.id ?? null;
      }
    } catch (err) {
      result.errors.push(`insight ${user.telegramChatId}: ${err instanceof Error ? err.message : "unknown"}`);
      continue;
    }

    const card = formatAqiCard({
      city: cached.city,
      usAqi: cached.usAqi,
      category: rule.category,
      pollutant: cached.mainPollutant,
      isAlert: true,
      freshness: current.freshness,
      dataAgeMinutes: cached.dataAgeMinutes,
      medicalHistory: profile?.medicalHistory ?? [],
    });
    const block = formatRecommendationBlock({
      insight: ai.insight,
      recommendation: ai.recommendation,
      medicalHistory: profile?.medicalHistory ?? [],
    });

    const sendCard = await sendTelegramMessage(user.telegramChatId, card);
    const sendReco = sendCard.ok ? await sendTelegramMessage(user.telegramChatId, block) : sendCard;
    const ok = sendCard.ok && sendReco.ok;
    await db.insert(notificationDeliveries).values({
      personalizedInsightId: insightId,
      alertEventId: alertEvent.id,
      userId: user.id,
      channel: "telegram",
      recipient: user.telegramChatId,
      status: ok ? "sent" : "failed",
      sentAt: ok ? now : null,
      error: ok ? null : (sendCard.error ?? sendReco.error ?? "send failed"),
    });
    if (ok) result.sent += 1;
    else {
      result.skipped += 1;
      result.errors.push(`send ${user.telegramChatId}: ${sendCard.error ?? sendReco.error ?? "unknown"}`);
    }
  }
  return result;
}
