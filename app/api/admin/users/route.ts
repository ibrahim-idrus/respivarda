export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/src/db";
import {
  conversationStates,
  locations,
  notificationDeliveries,
  userProfiles,
  users,
} from "@/src/db/schema";

export async function GET() {
  try {
    const [rows, totalCountResult, telegramCountResult] = await Promise.all([
      db
        .select({
          id: users.id,
          name: users.name,
          whatsappNumber: users.whatsappNumber,
          telegramChatId: users.telegramChatId,
          telegramUsername: users.telegramUsername,
          locale: users.locale,
          latitude: users.latitude,
          longitude: users.longitude,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          city: locations.city,
          gender: userProfiles.gender,
          age: userProfiles.age,
          medicalHistory: userProfiles.medicalHistory,
          conversationStep: conversationStates.step,
          deliveriesCount: sql<number>`cast(count(${notificationDeliveries.id}) as int)`,
        })
        .from(users)
        .leftJoin(locations, eq(users.locationId, locations.id))
        .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
        .leftJoin(
          conversationStates,
          and(
            eq(conversationStates.platform, "telegram"),
            eq(conversationStates.externalId, users.telegramChatId)
          )
        )
        .leftJoin(notificationDeliveries, eq(notificationDeliveries.userId, users.id))
        .groupBy(
          users.id,
          locations.city,
          userProfiles.gender,
          userProfiles.age,
          userProfiles.medicalHistory,
          conversationStates.step
        )
        .orderBy(desc(users.createdAt))
        .limit(100),

      db
        .select({ value: sql<number>`count(*)::int` })
        .from(users)
        .then((r) => r[0]?.value ?? 0),

      db
        .select({ value: sql<number>`count(*)::int` })
        .from(users)
        .where(isNotNull(users.telegramChatId))
        .then((r) => r[0]?.value ?? 0),
    ]);

    // Calculate metrics
    const total = totalCountResult;
    const totalTelegram = telegramCountResult;
    let activeAlertUsers = 0;
    let awaitingLocationUsers = 0;

    const enrichedRows = rows.map((u) => {
      const hasTelegram = !!u.telegramChatId;
      const hasCoords = u.latitude != null && u.longitude != null;
      const isOnboarded = u.conversationStep === "onboarded" || hasCoords;

      if (hasTelegram) {
        if (isOnboarded) {
          activeAlertUsers += 1;
        } else {
          awaitingLocationUsers += 1;
        }
      }

      return {
        ...u,
        hasTelegram,
        alertStatus: !hasTelegram
          ? "none"
          : isOnboarded
          ? "active"
          : "awaiting_location",
      };
    });

    return NextResponse.json({
      data: enrichedRows,
      total,
      metrics: {
        totalUsers: total,
        totalTelegram,
        activeAlertUsers,
        awaitingLocationUsers,
      },
    });
  } catch (err) {
    console.error("Failed to fetch admin users:", err);
    return NextResponse.json(
      { error: "Gagal memuat data pengguna", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
