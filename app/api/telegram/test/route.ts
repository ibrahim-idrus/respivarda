import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sendTelegramMessage } from "@/lib/telegram";
import { db } from "@/src/db";
import { eq } from "drizzle-orm";
import { users } from "@/src/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ ok: false, error: "Tidak terautentikasi." }, { status: 401 });
  }
  let targetChatId: string | null = null;
  let customMessage: string | null = null;

  try {
    const body = await req.json();
    if (body?.chatId && typeof body.chatId === "string" && /^\d{5,20}$/.test(body.chatId.trim())) {
      targetChatId = body.chatId.trim();
    }
    if (body?.message && typeof body.message === "string" && body.message.trim().length <= 1000) {
      customMessage = body.message.trim();
    }
  } catch {
    // No body or not JSON, proceed to default
  }

  if (!targetChatId) {
    return NextResponse.json(
      { ok: false, error: "chatId wajib diisi." },
      { status: 400 }
    );
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.telegramChatId, targetChatId))
    .limit(1);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Chat ID tidak terdaftar." },
      { status: 404 }
    );
  }

  const messageToSend = customMessage ?? "Pesan uji coba dari Konsol Admin Respivarda. Sistem peringatan beroperasi normal.";
  const result = await sendTelegramMessage(targetChatId, messageToSend);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: "Gagal mengirim pesan." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
