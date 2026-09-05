"use client";

import Link from "next/link";
import { Button } from "@cloudflare/kumo";
import { CloudSun, MapPin } from "@phosphor-icons/react";

export default function Header({ onOpenModal }: { onOpenModal: () => void }) {
  return (
    <header className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur border-b border-surface-container">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
            <CloudSun size={20} weight="fill" />
          </div>
          <div className="leading-tight">
            <p className="text-base font-extrabold tracking-tight">Respivarda</p>
            <p className="text-[11px] font-medium text-on-surface-variant">
              Public Environmental Service
            </p>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
          <span className="text-secondary">Dashboard</span>
          <Link
            href="/feedback"
            className="text-on-surface-variant transition-colors hover:text-secondary"
          >
            Feedback
          </Link>
          <span className="hidden items-center gap-1.5 text-xs font-medium text-on-surface-variant lg:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Live Monitoring • Updated 2m ago
          </span>
        </nav>

        <Button
          variant="primary"
          size="sm"
          icon={<MapPin weight="fill" />}
          onClick={onOpenModal}
        >
          Set Location
        </Button>
      </div>
    </header>
  );
}
