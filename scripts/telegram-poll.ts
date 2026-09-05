import { processUpdate } from "@/app/api/telegram/webhook/route";

const token = process.env.Telegram_URL ?? process.env.TELEGRAM_URL;
if (!token) {
  console.error("Telegram bot token env var is not set (Telegram_URL / TELEGRAM_URL)");
  process.exit(1);
}

const api = `https://api.telegram.org/bot${token}`;

type Update = { update_id: number } & Parameters<typeof processUpdate>[0];

async function call<T>(method: string, body: unknown): Promise<T> {
  const res = await fetch(`${api}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { ok: boolean; result: T; description?: string };
  if (!res.ok || !data.ok) throw new Error(`${method}: ${data.description ?? res.status}`);
  return data.result;
}

async function main() {
  // A registered webhook makes getUpdates return nothing; clear it for polling.
  await call("deleteWebhook", { drop_pending_updates: false });
  console.log("telegram:poll — listening (Ctrl+C to stop)");

  let offset = 0;
  for (;;) {
    try {
      const updates = await call<Update[]>("getUpdates", {
        offset,
        timeout: 30,
        allowed_updates: ["message"],
      });
      for (const u of updates) {
        offset = u.update_id + 1;
        try {
          await processUpdate(u);
        } catch (err) {
          console.error("update error:", err instanceof Error ? err.message : "unknown");
        }
      }
    } catch (err) {
      console.error("poll error:", err instanceof Error ? err.message : "unknown");
      await new Promise((r) => setTimeout(r, 3000)); // backoff, then resume
    }
  }
}

main();
