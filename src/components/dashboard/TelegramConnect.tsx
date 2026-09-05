"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@cloudflare/kumo";
import { CheckCircle, PaperPlaneTilt } from "@phosphor-icons/react";

type ConnectionState = "disconnected" | "connecting" | "connected";


export default function TelegramConnect() {
  const [state, setState] = useState<ConnectionState>("disconnected");
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [testSent, setTestSent] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  };

  useEffect(() => {
    fetch("/api/telegram/status")
      .then((r) => r.json())
      .then((d: { botUsername: string | null; connected: boolean }) => {
        setBotUsername(d.botUsername);
        if (d.connected) setState("connected");
      })
      .catch(() => {});
    return stopPolling;
  }, []);

  const startPolling = () => {
    stopPolling();
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const r = await fetch("/api/telegram/status");
        const d = (await r.json()) as { connected: boolean };
        if (d.connected) {
          setState("connected");
          stopPolling();
        }
      } catch {}
      if (attempts >= 40) {
        setState("disconnected");
        stopPolling();
      }
    }, 3000);
  };

  const onConnect = () => {
    setState("connecting");
    startPolling();
    if (botUsername) {
      window.open(`https://t.me/${botUsername}`, "_blank", "noopener");
    }
  };

  const onTest = async () => {
    const r = await fetch("/api/telegram/test", { method: "POST" });
    if (r.ok) setTestSent(true);
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-surface-container bg-surface-container-lowest p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
            <PaperPlaneTilt size={20} weight="fill" />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight">
              Telegram Alerts
            </h2>
            {state === "connected" ? (
              <p className="flex items-center gap-1.5 text-sm text-secondary">
                <CheckCircle size={16} weight="fill" />
                Connected — you will receive air-quality alerts
              </p>
            ) : (
              <p className="text-sm text-on-surface-variant">
                {state === "connecting"
                  ? "Waiting for you to press Start in Telegram..."
                  : "Connect the Respivarda bot to receive important air-quality alerts."}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {state === "connected" && !testSent && (
            <Button variant="secondary" size="sm" onClick={onTest}>
              Send Test Message
            </Button>
          )}
          {testSent && (
            <span className="text-sm font-semibold text-secondary">
              Test message sent
            </span>
          )}
          {state !== "connected" && (
            <Button
              variant="primary"
              size="sm"
              icon={<PaperPlaneTilt weight="fill" />}
              onClick={onConnect}
              disabled={state === "connecting"}
            >
              {state === "connecting" ? "Connecting..." : "Connect Telegram"}
            </Button>
          )}
        </div>
      </div>
      {state === "connecting" && !botUsername && (
        <p className="mt-2 text-xs text-on-surface-variant">
          Bot username is not configured. Set TELEGRAM_BOT_USERNAME on the
          server, then open the bot in Telegram and press Start.
        </p>
      )}
    </section>
  );
}
