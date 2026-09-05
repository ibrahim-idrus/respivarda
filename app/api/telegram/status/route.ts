import { isNotNull } from "drizzle-orm";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { getBotUsername } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/telegram/status → { botUsername, connected, username? }
// Never returns the token. Client polls this while "connecting".
// ponytail: single-user mode — ceiling: returns the first connected user row,
// correct only while one person uses the app. upgrade: filter by session user.
export async function GET() {
  const rows = await db
    .select({ telegramChatId: users.telegramChatId })
    .from(users)
    .where(isNotNull(users.telegramChatId))
    .limit(1);

  return Response.json({
    botUsername: getBotUsername(),
    connected: rows.length > 0,
  });
}
