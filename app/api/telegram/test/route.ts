import { isNotNull } from "drizzle-orm";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEST_MESSAGE = [
  "Respivarda Telegram Connected",
  "",
  "Your Telegram account is now connected to Respivarda.",
  "You will receive important air-quality alerts here.",
].join("\n");

// POST /api/telegram/test — browser calls this, server calls Telegram.
// Browser never touches the Bot API directly.
// ponytail: single-user mode — ceiling: sends to the first connected row, not
// the requesting user. upgrade: filter by session user.
export async function POST() {
  const rows = await db
    .select({ telegramChatId: users.telegramChatId })
    .from(users)
    .where(isNotNull(users.telegramChatId))
    .limit(1);

  const chatId = rows[0]?.telegramChatId;
  if (!chatId) {
    return Response.json(
      { ok: false, error: "No Telegram chat connected" },
      { status: 404 }
    );
  }

  const result = await sendTelegramMessage(chatId, TEST_MESSAGE);
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 502 });
  }
  return Response.json({ ok: true });
}
