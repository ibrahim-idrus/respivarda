declare global {
  var __telegramPollStarted: boolean | undefined;
}

if (!globalThis.__telegramPollStarted) {
  const token =
    process.env.TELEGRAM_BOT_TOKEN ?? process.env.Telegram_URL ?? process.env.TELEGRAM_URL;
  const pollAuto = process.env.TELEGRAM_POLL_AUTO;
  const isDev = process.env.NODE_ENV !== "production";
  const onVercel = Boolean(process.env.VERCEL);
  const shouldPoll = !!token && !onVercel && (pollAuto === "1" || (isDev && pollAuto !== "0"));

  if (shouldPoll) {
    globalThis.__telegramPollStarted = true;

    const api = `https://api.telegram.org/bot${token}`;

    type Update = { update_id: number; message?: unknown };

    async function call<T>(method: string, body: unknown): Promise<T> {
      const res = await fetch(`${api}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = (await res.json()) as { ok: boolean; result: T; description?: string };
      if (!res.ok || !data.ok) throw new Error(`${method}: ${data.description ?? res.status}`);
      return data.result;
    }

    (async () => {
      try {
        await call('deleteWebhook', { drop_pending_updates: false });
        console.log('[telegram] auto-poll started');
      } catch (e) {
        console.error('[telegram] deleteWebhook failed:', e instanceof Error ? e.message : e);
      }

      let offset = 0;
      const { processUpdate } = await import('@/app/api/telegram/webhook/route');

      for (;;) {
        try {
          const updates = await call<Update[]>('getUpdates', {
            offset,
            timeout: 30,
            allowed_updates: ['message']
          });
          for (const u of updates) {
            offset = u.update_id + 1;
            try {
              await processUpdate(u as Parameters<typeof processUpdate>[0]);
            } catch (err) {
              console.error('[telegram] update error:', err instanceof Error ? err.message : 'unknown');
            }
          }
        } catch (err) {
          console.error('[telegram] poll error:', err instanceof Error ? err.message : 'unknown');
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    })();
  }
}

export {};
