import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ ok: false, error: "Tidak terautentikasi." }, { status: 401 });
  }
  const token = process.env.Telegram_URL ?? process.env.TELEGRAM_URL;
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Telegram bot token env var is not set" },
      { status: 500 }
    );
  }

  let base: string;
  try {
    const body = (await req.json()) as { url?: string };
    if (!body.url) throw new Error("missing url");
    const parsed = new URL(body.url);
    if (parsed.protocol !== "https:") throw new Error("https only");
    base = parsed.origin;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Body must be JSON with a valid https url" },
      { status: 400 }
    );
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "TELEGRAM_WEBHOOK_SECRET belum diatur." },
      { status: 500 }
    );
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: `${base}/api/telegram/webhook`,
      secret_token: secret,
    }),
  });
  const data = (await res.json()) as { ok: boolean; description?: string };

  return Response.json(
    { ok: data.ok },
    { status: data.ok ? 200 : 502 }
  );
}
