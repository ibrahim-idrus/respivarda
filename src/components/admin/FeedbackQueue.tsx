"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Empty, Select, Table } from "@cloudflare/kumo";
import {
  ChatCircleText,
  Eye,
  MagnifyingGlass,
  MapPin,
  PaperPlaneTilt,
  WhatsappLogo,
} from "@phosphor-icons/react";
import {
  CATEGORY_LABEL,
  formatWIB,
  STATUS_BADGE,
  STATUS_LABEL,
  type Feedback,
} from "@/src/lib/admin-utils";
import FeedbackDetailModal from "./FeedbackDetailModal";

const PAGE_SIZE = 10;

const TABS: { key: "all" | Feedback["status"]; label: string }[] = [
  { key: "all", label: "Semua Laporan" },
  { key: "pending", label: "Menunggu" },
  { key: "investigating", label: "Diselidiki" },
  { key: "flagged", label: "Ditandai" },
  { key: "resolved", label: "Selesai" },
];

type FeedbackResponse = { data: Feedback[]; counts: Record<string, number> };

export default function FeedbackQueue() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Feedback | null>(null);

  const query = useQuery<FeedbackResponse>({
    queryKey: ["feedback", tab],
    queryFn: async () => {
      const res = await fetch(`/api/feedback?status=${tab}`);
      if (!res.ok) throw new Error("Gagal memuat laporan masukan.");
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
      if (!res.ok) throw new Error("Gagal memperbarui status laporan.");
      return res.json() as Promise<Feedback>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feedback"] }),
  });

  const counts = query.data?.counts;
  const rawRows = useMemo(() => query.data?.data ?? [], [query.data]);

  // Client-side category and keyword filtering
  const filteredRows = useMemo(() => {
    return rawRows.filter((row) => {
      if (categoryFilter !== "all" && row.category !== categoryFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const refMatch = row.reportRef?.toLowerCase().includes(q);
      const nameMatch = row.contactName?.toLowerCase().includes(q);
      const descMatch = row.description?.toLowerCase().includes(q);
      const locMatch = row.locationText?.toLowerCase().includes(q);
      const waMatch = row.contactWhatsApp?.includes(q);
      const tgMatch = row.contactTelegram?.includes(q);

      return refMatch || nameMatch || descMatch || locMatch || waMatch || tgMatch;
    });
  }, [rawRows, categoryFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pageRows = useMemo(() => {
    return filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredRows, page]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header controls: Tab filters with badges */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((t) => {
            const count = counts?.[t.key] ?? 0;
            const isActive = tab === t.key;
            return (
              <Button
                key={t.key}
                variant={isActive ? "primary" : "secondary"}
                size="sm"
                onClick={() => {
                  setTab(t.key);
                  setPage(1);
                }}
              >
                {t.label}
                {counts != null && (
                  <span
                    className={`ml-1.5 rounded-full px-2 py-0.5 text-xs font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
        <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-xl border border-surface-container bg-surface px-3 py-1.5 focus-within:border-secondary">
          <MagnifyingGlass size={18} className="text-on-surface-variant" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Cari referensi, pelapor, atau deskripsi..."
            className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/60"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs text-on-surface-variant hover:text-on-surface"
            >
              Reset
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-on-surface-variant">Kategori:</span>
          <Select
            aria-label="Filter kategori masukan"
            size="sm"
            value={categoryFilter}
            onValueChange={(v: string | null) => {
              setCategoryFilter(v ?? "all");
              setPage(1);
            }}
          >
            <Select.Option value="all">Semua Kategori</Select.Option>
            {Object.entries(CATEGORY_LABEL).map(([val, label]) => (
              <Select.Option key={val} value={val}>
                {label}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>

      {/* Error state */}
      {query.isError && (
        <div className="rounded-xl border border-error/20 bg-error/10 p-4 text-sm font-medium text-error">
          Gagal memuat laporan masukan. Silakan muat ulang halaman.
        </div>
      )}

      {/* Table of User Feedback */}
      <div className="overflow-x-auto rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head className="whitespace-nowrap">No. Laporan</Table.Head>
              <Table.Head className="whitespace-nowrap">Pelapor & Kontak</Table.Head>
              <Table.Head className="whitespace-nowrap">Kategori</Table.Head>
              <Table.Head className="whitespace-nowrap">Deskripsi & Lokasi</Table.Head>
              <Table.Head className="whitespace-nowrap">Status</Table.Head>
              <Table.Head className="whitespace-nowrap">Waktu (WIB)</Table.Head>
              <Table.Head className="whitespace-nowrap text-right">Aksi</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {query.isLoading && (
              <Table.Row>
                <Table.Cell colSpan={7}>
                  <div className="flex items-center justify-center py-12 text-sm text-on-surface-variant">
                    <span className="animate-pulse">Memuat data tabel masukan masyarakat...</span>
                  </div>
                </Table.Cell>
              </Table.Row>
            )}

            {!query.isLoading && pageRows.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={7}>
                  <div className="py-12">
                    <Empty
                      icon={<ChatCircleText size={36} className="text-on-surface-variant" />}
                      title="Tidak ada laporan masukan"
                      description="Belum ada data masukan masyarakat pada filter yang dipilih."
                    />
                  </div>
                </Table.Cell>
              </Table.Row>
            )}

            {!query.isLoading &&
              pageRows.map((fb) => (
                <Table.Row key={fb.id} className="transition-colors hover:bg-surface-container-low/40">
                  {/* No. Laporan */}
                  <Table.Cell className="align-top font-mono font-bold text-on-surface">
                    <span className="inline-block rounded-md bg-surface-container px-2 py-0.5 text-xs font-semibold text-secondary">
                      {fb.reportRef}
                    </span>
                  </Table.Cell>

                  {/* Pelapor & Kontak */}
                  <Table.Cell className="align-top">
                    <div className="flex flex-col">
                      <span className="font-semibold text-on-surface">
                        {fb.contactName || "Anonim"}
                      </span>
                      <div className="mt-1 flex flex-col gap-0.5 text-xs text-on-surface-variant">
                        {fb.contactWhatsApp && (
                          <a
                            href={`https://wa.me/${fb.contactWhatsApp.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-600 hover:underline"
                          >
                            <WhatsappLogo size={14} weight="fill" />
                            {fb.contactWhatsApp}
                          </a>
                        )}
                        {fb.contactTelegram && (
                          <span className="inline-flex items-center gap-1 text-sky-600">
                            <PaperPlaneTilt size={14} weight="fill" />
                            {fb.contactTelegram}
                          </span>
                        )}
                        {!fb.contactWhatsApp && !fb.contactTelegram && (
                          <span className="text-on-surface-variant/70">-</span>
                        )}
                      </div>
                    </div>
                  </Table.Cell>

                  {/* Kategori */}
                  <Table.Cell className="align-top">
                    <Badge variant="outline" className="text-xs">
                      {CATEGORY_LABEL[fb.category] || fb.category}
                    </Badge>
                  </Table.Cell>

                  {/* Deskripsi & Lokasi */}
                  <Table.Cell className="max-w-md align-top">
                    <div className="flex flex-col gap-1">
                      <p className="line-clamp-2 text-sm text-on-surface" title={fb.description}>
                        {fb.description}
                      </p>
                      {(fb.locationText || fb.coordinates) && (
                        <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                          <MapPin size={13} className="shrink-0 text-secondary" weight="fill" />
                          <span className="truncate">
                            {fb.locationText ||
                              `Lat ${fb.coordinates?.lat}, Lon ${fb.coordinates?.long}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </Table.Cell>

                  {/* Status */}
                  <Table.Cell className="align-top">
                    <Badge
                      variant={
                        STATUS_BADGE[fb.status] as
                          | "neutral"
                          | "info"
                          | "warning"
                          | "success"
                      }
                    >
                      {STATUS_LABEL[fb.status] || fb.status}
                    </Badge>
                  </Table.Cell>

                  {/* Waktu (WIB) */}
                  <Table.Cell className="whitespace-nowrap align-top text-xs text-on-surface-variant">
                    {formatWIB(fb.createdAt)}
                  </Table.Cell>

                  {/* Aksi */}
                  <Table.Cell className="align-top text-right">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Eye size={14} />}
                        onClick={() => setSelected(fb)}
                      >
                        Detail
                      </Button>

                      {fb.status === "pending" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={setStatus.isPending}
                          onClick={() =>
                            setStatus.mutate({ id: fb.id, status: "investigating" })
                          }
                        >
                          Selidiki
                        </Button>
                      )}

                      {(fb.status === "pending" || fb.status === "investigating" || fb.status === "flagged") && (
                        <Button
                          variant="outline"
                          size="sm"
                          loading={setStatus.isPending}
                          onClick={() =>
                            setStatus.mutate({ id: fb.id, status: "resolved" })
                          }
                        >
                          Selesai
                        </Button>
                      )}
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
          </Table.Body>
        </Table>
      </div>

      {/* Pagination Footer */}
      {!query.isLoading && filteredRows.length > PAGE_SIZE && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-4 text-xs text-on-surface-variant">
          <span>
            Menampilkan {(page - 1) * PAGE_SIZE + 1} -{" "}
            {Math.min(page * PAGE_SIZE, filteredRows.length)} dari {filteredRows.length} laporan
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Sebelumnya
            </Button>
            <span className="px-2 text-xs font-semibold text-on-surface">
              {page} / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <FeedbackDetailModal feedback={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
