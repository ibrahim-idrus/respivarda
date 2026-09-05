export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/telegram/setup { url: "https://YOUR_DOMAIN" }
// Registers the Telegram webhook. Not called automatically on page load —
// invoke manually during deployment or local dev (via ngrok/cloudflared).
// Token is used server-side only and never appears in the response.
//
//   curl -X POST http://localhost:3000/api/telegram/setup \
//     -H 'Content-Type: application/json' \
//     -d '{"url":"https://abc123.ngrok-free.app"}'
//
// ponytail: unauthenticated setup endpoint — ceiling: anyone who guesses the
// URL can re-point the webhook. upgrade: protect with a shared secret header
// (same pattern as CRON_SECRET).
export async function POST(req: Request) {
  const token = process.env.Telegram_URL ?? process.env.TELEGRAM_URL;
  if (!token) {
    return Response.json(
      { ok: false, error: "Telegram bot token env var is not set" },
      { status: 500 }
    );
  }

  let base: string;
  try {
    const body = (await req.json()) as { url?: string };
    if (!body.url) throw new Error("missing url");
    base = new URL(body.url).origin; // strips any path/token smuggling
  } catch {
    return Response.json(
      { ok: false, error: "Body must be JSON with a valid absolute url" },
      { status: 400 }
    );
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: `${base}/api/telegram/webhook`,
      // Registers the secret so Telegram signs every update; the webhook
      // validates it via isValidWebhookSecret.
      ...(secret ? { secret_token: secret } : {}),
    }),
  });
  const data = (await res.json()) as { ok: boolean; description?: string };

  return Response.json(
    { ok: data.ok, description: data.description },
    { status: data.ok ? 200 : 502 }
  );
}
