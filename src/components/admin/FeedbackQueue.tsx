"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Empty, Surface } from "@cloudflare/kumo";
import {
  CATEGORY_LABEL,
  formatWIB,
  STATUS_BADGE,
  STATUS_LABEL,
  type Feedback,
} from "@/src/lib/admin-utils";
import FeedbackDetailModal from "./FeedbackDetailModal";

const TABS: { key: "all" | Feedback["status"]; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Menunggu" },
  { key: "investigating", label: "Diselidiki" },
  { key: "flagged", label: "Ditandai" },
  { key: "resolved", label: "Selesai" },
];

type FeedbackResponse = { data: Feedback[]; counts: Record<string, number> };

export default function FeedbackQueue() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");
  const [selected, setSelected] = useState<Feedback | null>(null);

  const query = useQuery<FeedbackResponse>({
    queryKey: ["feedback", tab],
    queryFn: async () => {
      const res = await fetch(`/api/feedback?status=${tab}`);
      if (!res.ok) throw new Error("Gagal memuat laporan");
      return res.json();
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui status");
      return res.json() as Promise<Feedback>;
    },
    // ponytail: broad invalidation of all status-tab queries — ceiling:
    // refetches every visited tab. Fine at this size; upgrade: targeted
    // setQueryData per tab.
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feedback"] }),
  });

  const counts = query.data?.counts;
  const rows = query.data?.data ?? [];

  return (
    <div className="flex flex-col gap-5">
      {/* Status tabs with counts */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button
            key={t.key}
            variant={tab === t.key ? "primary" : "secondary"}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {counts != null && (
              <span className="ml-1 opacity-70">({counts[t.key] ?? 0})</span>
            )}
          </Button>
        ))}
      </div>

      {query.isLoading && (
        <p className="text-sm text-on-surface-variant">Memuat laporan…</p>
      )}
      {query.isError && (
        <p className="text-sm text-error">
          Gagal memuat laporan. Coba muat ulang halaman.
        </p>
      )}

      {!query.isLoading && !query.isError && rows.length === 0 && (
        <Empty
          icon={null}
          title="Belum ada laporan"
          description="Belum ada laporan pada kategori ini."
        />
      )}

      <div className="flex flex-col gap-3">
        {rows.map((fb) => (
          <Surface key={fb.id} className="rounded-xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-on-surface">
                    {fb.reportRef}
                  </span>
                  <Badge variant="outline">{CATEGORY_LABEL[fb.category]}</Badge>
                  <Badge
                    variant={
                      STATUS_BADGE[fb.status] as
                        | "neutral"
                        | "info"
                        | "warning"
                        | "success"
                    }
                  >
                    {STATUS_LABEL[fb.status]}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-sm text-on-surface-variant">
                  {fb.description}
                </p>
                <span className="text-[12px] text-on-surface-variant">
                  {fb.contactName ?? "Anonim"} · {formatWIB(fb.createdAt)}
                </span>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button variant="ghost" onClick={() => setSelected(fb)}>
                  Lihat Detail
                </Button>
                {fb.status === "pending" && (
                  <Button
                    variant="secondary"
                    loading={setStatus.isPending}
                    onClick={() =>
                      setStatus.mutate({ id: fb.id, status: "investigating" })
                    }
                  >
                    Tandai Telah Diselidiki
                  </Button>
                )}
                {(fb.status === "pending" || fb.status === "flagged") && (
                  <Button
                    variant="outline"
                    loading={setStatus.isPending}
                    onClick={() =>
                      setStatus.mutate({ id: fb.id, status: "resolved" })
                    }
                  >
                    Tandai Selesai
                  </Button>
                )}
                {fb.status !== "flagged" && fb.status !== "resolved" && (
                  <Button
                    variant="ghost"
                    loading={setStatus.isPending}
                    onClick={() =>
                      setStatus.mutate({ id: fb.id, status: "flagged" })
                    }
                  >
                    Tandai
                  </Button>
                )}
              </div>
            </div>
          </Surface>
        ))}
      </div>

      <FeedbackDetailModal
        feedback={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
