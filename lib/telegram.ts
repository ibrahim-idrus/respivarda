
function getToken(): string {
  const token =
    process.env.TELEGRAM_BOT_TOKEN ?? process.env.Telegram_URL ?? process.env.TELEGRAM_URL;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN (alias TELEGRAM_URL) is not set");
  return token;
}

export function getBotUsername(): string | null {
  return process.env.TELEGRAM_BOT_USERNAME ?? null;
}


export function isValidWebhookSecret(req: Request): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return true;
  return req.headers.get("x-telegram-bot-api-secret-token") === secret;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendChatAction(
  chatId: number | string,
  action: "typing" | "upload_photo" | "find_location" = "typing"
): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${getToken()}/sendChatAction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action }),
    });
  } catch {
    // Indikator mengetik bersifat best-effort, kegagalan diabaikan.
  }
}

export async function withTyping<T>(chatId: number | string, work: () => Promise<T>): Promise<T> {
  const timer = setInterval(() => void sendChatAction(chatId, "typing"), 4000);
  void sendChatAction(chatId, "typing");
  try {
    return await work();
  } finally {
    clearInterval(timer);
  }
}

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  replyMarkup?: unknown,
  opts?: { parseMode?: "HTML" | null }
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${getToken()}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: opts?.parseMode === null ? undefined : "HTML",
          ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
        }),
      }
    );
    const data = (await res.json()) as { ok: boolean; description?: string };
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.description ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}
