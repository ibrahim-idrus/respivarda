"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge, Surface } from "@cloudflare/kumo";
import {
  ChatCircleText,
  CheckCircle,
  Flag,
  Hourglass,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { CATEGORY_LABEL, formatWIB, type Feedback } from "@/src/lib/admin-utils";

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
  const recent = (query.data?.data ?? []).slice(0, 3);

  const stats = [
    { label: "Total Masukan", value: counts.all, icon: ChatCircleText },
    { label: "Menunggu", value: counts.pending, icon: Hourglass },
    { label: "Diselidiki", value: counts.investigating, icon: MagnifyingGlass },
    { label: "Ditandai", value: counts.flagged, icon: Flag },
    { label: "Selesai", value: counts.resolved, icon: CheckCircle },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
        Telemetri Masukan
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <Surface key={s.label} className="rounded-xl p-3">
            <div className="flex flex-col gap-1">
              <s.icon size={18} className="text-on-surface-variant" />
              <span className="text-xl font-bold text-on-surface">
                {query.isLoading ? "…" : (s.value ?? 0)}
              </span>
              <span className="text-[11px] text-on-surface-variant">
                {s.label}
              </span>
            </div>
          </Surface>
        ))}
      </div>

      <h3 className="mt-2 text-sm font-bold uppercase tracking-wider text-on-surface-variant">
        Masukan Terbaru
      </h3>
      <div className="flex flex-col gap-2">
        {recent.map((fb) => (
          <Surface key={fb.id} className="rounded-xl p-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-bold text-on-surface">
                  {fb.reportRef}
                </span>
                <Badge variant="outline">
                  {CATEGORY_LABEL[fb.category]}
                </Badge>
              </div>
              <p className="line-clamp-2 text-[12px] text-on-surface-variant">
                {fb.description}
              </p>
              <span className="text-[11px] text-on-surface-variant">
                {formatWIB(fb.createdAt)}
              </span>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}
