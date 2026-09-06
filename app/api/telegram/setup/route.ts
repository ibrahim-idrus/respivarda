import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getToken(): string {
  const token =
    process.env.TELEGRAM_BOT_TOKEN ?? process.env.Telegram_URL ?? process.env.TELEGRAM_URL;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN (alias TELEGRAM_URL) is not set");
  return token;
}

function resolveBaseUrl(req: Request, bodyUrl?: unknown): string {
  if (typeof bodyUrl === "string" && bodyUrl.trim()) {
    const parsed = new URL(bodyUrl.trim());
    if (parsed.protocol !== "https:") throw new Error("https only");
    return parsed.origin;
  }
  const envBase =
    process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL;
  if (envBase) {
    const normalized = envBase.startsWith("http") ? envBase : `https://${envBase}`;
    const parsed = new URL(normalized);
    if (parsed.protocol !== "https:") throw new Error("https only");
    return parsed.origin;
  }
  const origin = new URL(req.url).origin;
  const parsed = new URL(origin);
  if (parsed.protocol !== "https:") throw new Error("https only");
  return parsed.origin;
}

async function telegramCall<T>(method: string, body: unknown): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${getToken()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { ok: boolean; result: T; description?: string };
  if (!res.ok || !data.ok) throw new Error(data.description ?? `HTTP ${res.status}`);
  return data.result;
}

export async function GET(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ ok: false, error: "Tidak terautentikasi." }, { status: 401 });
  }
  try {
    const info = await telegramCall<{
      url: string;
      has_custom_certificate: boolean;
      pending_update_count: number;
      last_error_date?: number;
      last_error_message?: string;
    }>("getWebhookInfo", {});
    return NextResponse.json({ ok: true, webhook: info });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Gagal membaca webhook." },
      { status: 502 }
    );
  }
}

export async function POST(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ ok: false, error: "Tidak terautentikasi." }, { status: 401 });
  }
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "TELEGRAM_WEBHOOK_SECRET belum diatur." },
      { status: 500 }
    );
  }

  let bodyUrl: unknown;
  try {
    bodyUrl = ((await req.json()) as { url?: unknown })?.url;
  } catch {
    bodyUrl = undefined;
  }

  let base: string;
  try {
    base = resolveBaseUrl(req, bodyUrl);
  } catch {
    return NextResponse.json(
      { ok: false, error: "URL dasar harus https yang valid (kirim { url } atau set APP_URL)." },
      { status: 400 }
    );
  }

  try {
    await telegramCall("setWebhook", {
      url: `${base}/api/telegram/webhook`,
      secret_token: secret,
      allowed_updates: ["message", "edited_message"],
      drop_pending_updates: true,
    });
    const webhook = await telegramCall("getWebhookInfo", {});
    return NextResponse.json({ ok: true, webhook });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Gagal memasang webhook." },
      { status: 502 }
    );
  }
}

export async function DELETE(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ ok: false, error: "Tidak terautentikasi." }, { status: 401 });
  }
  try {
    await telegramCall("deleteWebhook", { drop_pending_updates: false });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Gagal menghapus webhook." },
      { status: 502 }
    );
  }
}
