"use client";

import { useQuery } from "@tanstack/react-query";
import { Surface } from "@cloudflare/kumo";
import {
  ChatCircleText,
  CheckCircle,
  Flag,
  Hourglass,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import type { Feedback } from "@/src/lib/admin-utils";

type FeedbackResponse = { data: Feedback[]; counts: Record<string, number> };

export default function FeedbackTelemetry() {
  const query = useQuery<FeedbackResponse>({
    queryKey: ["feedback", "telemetry"],
    queryFn: async () => {
      const res = await fetch("/api/feedback?status=all");
      if (!res.ok) throw new Error("Gagal memuat telemetri");
      return res.json();
    },
  });

  const counts = query.data?.counts ?? {};

  const stats = [
    { label: "Total Masukan", value: counts.all, icon: ChatCircleText, color: "text-secondary" },
    { label: "Menunggu", value: counts.pending, icon: Hourglass, color: "text-amber-600" },
    { label: "Diselidiki", value: counts.investigating, icon: MagnifyingGlass, color: "text-sky-600" },
    { label: "Ditandai", value: counts.flagged, icon: Flag, color: "text-purple-600" },
    { label: "Selesai", value: counts.resolved, icon: CheckCircle, color: "text-emerald-600" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          Telemetri Laporan Masukan
        </h2>
        <span className="text-[11px] text-on-surface-variant">
          Pemantauan Laporan Lapangan
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <Surface key={s.label} className="rounded-2xl border border-outline-variant p-3.5 shadow-sm">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-on-surface-variant">
                  {s.label}
                </span>
                <s.icon size={18} className={s.color} weight="fill" />
              </div>
              <span className="text-2xl font-extrabold text-on-surface">
                {query.isLoading ? "…" : (s.value ?? 0)}
              </span>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}
