"use client";

import { Badge } from "@cloudflare/kumo";
import { ArrowsClockwise, UserCircle } from "@phosphor-icons/react";

export default function AdminHeader({ title }: { title: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-6">
      <h1 className="text-lg font-bold tracking-tight text-on-surface">
        {title}
      </h1>
      <div className="flex items-center gap-4">
        {/* ponytail: static sync text — ceiling: no real sync telemetry.
            upgrade: wire to last-ingest API when it exists. */}
        <span className="flex items-center gap-1.5 text-[12px] text-on-surface-variant">
          <ArrowsClockwise size={14} />
          Sinkronisasi: Baru saja
        </span>
        <div className="flex items-center gap-2">
          <UserCircle size={28} className="text-on-surface-variant" />
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-semibold text-on-surface">
              Admin
            </span>
            <Badge variant="neutral">Administrator</Badge>
          </div>
        </div>
      </div>
    </header>
  );
}
