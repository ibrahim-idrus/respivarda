"use client";

import Link from "next/link";
import { Button } from "@cloudflare/kumo";
import { PaperPlaneTilt } from "@phosphor-icons/react";

const BOT_URL = "https://t.me/Respivarda_bot";

export default function TelegramConnect() {
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
            <p className="text-sm text-on-surface-variant">
              Connect the Respivarda bot to receive important air-quality alerts.
            </p>
          </div>
        </div>

        <Link href={BOT_URL} target="_blank" rel="noopener">
          <Button variant="primary" size="sm" icon={<PaperPlaneTilt weight="fill" />}>
            Open Respivarda_bot
          </Button>
        </Link>
      </div>
    </section>
  );
}
