import { isNotNull } from "drizzle-orm";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEST_MESSAGE = [
  "🚨 [UJI COBA SISTEM PERINGATAN RESPIVARDA]",
  "",
  "Halo! Ini adalah pesan uji coba dari Konsol Admin Respivarda.",
  "Sistem peringatan dini kualitas udara & kabut asap Anda beroperasi secara normal.",
  "Status sensor: Aktif & Terpantau.",
].join("\n");

// POST /api/telegram/test — accepts optional { chatId?: string, message?: string }
export async function POST(req: Request) {
  let targetChatId: string | null = null;
  let customMessage: string | null = null;

  try {
    const body = await req.json();
    if (body?.chatId && typeof body.chatId === "string") {
      targetChatId = body.chatId.trim();
    }
    if (body?.message && typeof body.message === "string") {
      customMessage = body.message.trim();
    }
  } catch {
    // No body or not JSON, proceed to default
  }

  if (!targetChatId) {
    const rows = await db
      .select({ telegramChatId: users.telegramChatId })
      .from(users)
      .where(isNotNull(users.telegramChatId))
      .limit(1);

    targetChatId = rows[0]?.telegramChatId ?? null;
  }

  if (!targetChatId) {
    return Response.json(
      { ok: false, error: "Tidak ada akun Telegram yang terhubung." },
      { status: 404 }
    );
  }

  const messageToSend = customMessage || TEST_MESSAGE;
  const result = await sendTelegramMessage(targetChatId, messageToSend);

  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 502 });
  }

  return Response.json({
    ok: true,
    message: `Pesan uji coba berhasil dikirim ke Telegram Chat ID ${targetChatId}`,
    recipient: targetChatId,
  });
}
