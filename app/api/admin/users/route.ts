export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { locations, userProfiles, users } from "@/src/db/schema";

// ponytail: no auth, full registry dump with hard cap. ceiling: exposed PII,
// oldest users unreachable past 100. upgrade: clerk role check + pagination.
export async function GET() {
  const [rows, total] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        whatsappNumber: users.whatsappNumber,
        telegramChatId: users.telegramChatId,
        telegramUsername: users.telegramUsername,
        createdAt: users.createdAt,
        city: locations.city,
        gender: userProfiles.gender,
      })
      .from(users)
      .leftJoin(locations, eq(users.locationId, locations.id))
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .orderBy(desc(users.createdAt))
      .limit(100),
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(users)
      .then((r: { value: number }[]) => r[0].value),
  ]);

  return NextResponse.json({ data: rows, total });
}
