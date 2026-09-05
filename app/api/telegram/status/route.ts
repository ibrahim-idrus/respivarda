import { isNotNull } from "drizzle-orm";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { getBotUsername } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


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
