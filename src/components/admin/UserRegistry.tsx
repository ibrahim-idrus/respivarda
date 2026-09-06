"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Dialog, Empty, Select, Table } from "@cloudflare/kumo";
import {
  Broadcast,
  Check,
  CheckCircle,
  Copy,
  MagnifyingGlass,
  MapPin,
  PaperPlaneTilt,
  ShieldCheck,
  TelegramLogo,
  User,
  WarningCircle,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { formatWIB } from "@/src/lib/admin-utils";

const PAGE_SIZE = 10;

type UserRow = {
  id: string;
  name: string;
  whatsappNumber: string | null;
  telegramChatId: string | null;
  telegramUsername: string | null;
  locale: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
  city: string | null;
  gender: "male" | "female" | "other" | null;
  age: number | null;
  medicalHistory: string[] | null;
  conversationStep: string | null;
  deliveriesCount: number;
  hasTelegram: boolean;
  alertStatus: "active" | "awaiting_location" | "none";
};

type AdminUsersResponse = {
  data: UserRow[];
  total: number;
  metrics: {
    totalUsers: number;
    totalTelegram: number;
    activeAlertUsers: number;
    awaitingLocationUsers: number;
  };
};

export default function UserRegistry() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [sendingChatId, setSendingChatId] = useState<string | null>(null);
  const [settingUpTelegram, setSettingUpTelegram] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [alertFeedback, setAlertFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const query = useQuery<AdminUsersResponse>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Gagal memuat registri pengguna.");
      return res.json();
    },
    refetchInterval: 10000, 
  });

  const rawUsers = useMemo(() => query.data?.data ?? [], [query.data]);
  const metrics = query.data?.metrics ?? {
    totalUsers: rawUsers.length,
    totalTelegram: rawUsers.filter((u) => !!u.telegramChatId).length,
    activeAlertUsers: rawUsers.filter(
      (u) => !!u.telegramChatId && (u.latitude != null || u.conversationStep === "onboarded")
    ).length,
    awaitingLocationUsers: rawUsers.filter(
      (u) => !!u.telegramChatId && u.latitude == null && u.conversationStep !== "onboarded"
    ).length,
  };

  const filteredRows = useMemo(() => {
    return rawUsers.filter((u) => {
      if (statusFilter === "telegram_active" && u.alertStatus !== "active") {
        return false;
      }
      if (statusFilter === "telegram_awaiting" && u.alertStatus !== "awaiting_location") {
        return false;
      }
      if (statusFilter === "telegram_all" && !u.hasTelegram) {
        return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = u.name?.toLowerCase().includes(q);
      const usernameMatch = u.telegramUsername?.toLowerCase().includes(q);
      const chatIdMatch = u.telegramChatId?.includes(q);
      const waMatch = u.whatsappNumber?.includes(q);
      const cityMatch = u.city?.toLowerCase().includes(q);

      return nameMatch || usernameMatch || chatIdMatch || waMatch || cityMatch;
    });
  }, [rawUsers, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pageRows = useMemo(() => {
    return filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredRows, page]);

  const handleSendTestAlert = async (chatId: string, userName: string) => {
    setSendingChatId(chatId);
    setAlertFeedback(null);
    try {
      const res = await fetch("/api/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setAlertFeedback({
          type: "error",
          text: `Gagal mengirim ke ${userName}: ${data?.error || "Gagal menghubungi Telegram API."}`,
        });
      } else {
        setAlertFeedback({
          type: "success",
          text: `Berhasil mengirim pesan uji coba sistem peringatan ke ${userName} (Chat ID: ${chatId})!`,
        });
      }
    } catch {
      setAlertFeedback({
        type: "error",
        text: `Koneksi gagal saat mengirim pesan ke ${userName}.`,
      });
    } finally {
      setSendingChatId(null);
    }
  };

  const handleSetupTelegram = async () => {
    setSettingUpTelegram(true);
    setAlertFeedback(null);
    try {
      const res = await fetch("/api/telegram/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = await res.json().catch(() => null);
      const webhookUrl = data?.webhook?.url;

      if (!res.ok || !data?.ok) {
        setAlertFeedback({
          type: "error",
          text: data?.error || "Gagal memasang webhook Telegram.",
        });
      } else {
        setAlertFeedback({
          type: "success",
          text: `Webhook Telegram aktif${webhookUrl ? `: ${webhookUrl}` : "."}`,
        });
      }
    } catch {
      setAlertFeedback({
        type: "error",
        text: "Koneksi gagal saat memasang webhook Telegram.",
      });
    } finally {
      setSettingUpTelegram(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {/* Telegram Alert System Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-secondary/20 bg-gradient-to-r from-secondary/10 via-surface-container-lowest to-surface-container-lowest p-6 shadow-sm md:flex-row md:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-white shadow-sm">
            <TelegramLogo size={28} weight="fill" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-extrabold text-on-surface">
                Sistem Peringatan Dini Bot Telegram
              </h2>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500" />
                Bot Aktif
              </span>
            </div>
            <p className="mt-1 text-sm text-on-surface-variant">
              Monitoring pelanggan bot Telegram untuk pengiriman alert otomatis saat kabut asap atau AQI melonjak di sekitar lokasi GPS mereka.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            loading={settingUpTelegram}
            icon={<Broadcast size={16} />}
            onClick={handleSetupTelegram}
          >
            Aktifkan Webhook Telegram
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Pelanggan Telegram
            </span>
            <TelegramLogo size={20} className="text-sky-600" weight="fill" />
          </div>
          <span className="text-2xl font-extrabold text-on-surface">
            {metrics.totalTelegram}
          </span>
          <span className="text-[11px] text-on-surface-variant">
            Terhubung via /start
          </span>
        </div>

        <div className="flex flex-col gap-1 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Siaga Peringatan
            </span>
            <ShieldCheck size={20} className="text-emerald-600" weight="fill" />
          </div>
          <span className="text-2xl font-extrabold text-emerald-700">
            {metrics.activeAlertUsers}
          </span>
          <span className="text-[11px] text-emerald-800/80">
            GPS Aktif & Terpantau
          </span>
        </div>

        <div className="flex flex-col gap-1 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Menunggu Lokasi
            </span>
            <MapPin size={20} className="text-amber-600" weight="fill" />
          </div>
          <span className="text-2xl font-extrabold text-amber-700">
            {metrics.awaitingLocationUsers}
          </span>
          <span className="text-[11px] text-amber-800/80">
            Belum share koordinat
          </span>
        </div>

        <div className="flex flex-col gap-1 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Total Pengguna
            </span>
            <User size={20} className="text-secondary" weight="fill" />
          </div>
          <span className="text-2xl font-extrabold text-on-surface">
            {metrics.totalUsers}
          </span>
          <span className="text-[11px] text-on-surface-variant">
            Semua kanal terdaftar
          </span>
        </div>
      </div>

      {/* Alert Test Notification Banner */}
      {alertFeedback && (
        <div
          role="alert"
          className={`flex items-center justify-between rounded-2xl border p-4 text-sm font-medium ${
            alertFeedback.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800"
              : "border-error/30 bg-error/10 text-error"
          }`}
        >
          <div className="flex items-center gap-2">
            {alertFeedback.type === "success" ? (
              <CheckCircle size={20} weight="fill" className="shrink-0 text-emerald-600" />
            ) : (
              <WarningCircle size={20} weight="fill" className="shrink-0 text-error" />
            )}
            <span>{alertFeedback.text}</span>
          </div>
          <button
            onClick={() => setAlertFeedback(null)}
            className="text-xs font-bold underline opacity-80 hover:opacity-100"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
        <div className="flex min-w-[280px] flex-1 items-center gap-2 rounded-xl border border-surface-container bg-surface px-3 py-1.5 focus-within:border-secondary">
          <MagnifyingGlass size={18} className="text-on-surface-variant" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama, @username Telegram, atau Chat ID..."
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
          <span className="text-xs font-semibold text-on-surface-variant">Filter Status:</span>
          <Select
            aria-label="Filter status pengguna"
            size="sm"
            value={statusFilter}
            onValueChange={(v: string | null) => {
              setStatusFilter(v ?? "all");
              setPage(1);
            }}
          >
            <Select.Option value="all">Semua Pengguna</Select.Option>
            <Select.Option value="telegram_all">Semua Pengguna Telegram</Select.Option>
            <Select.Option value="telegram_active">Siaga Peringatan (Aktif)</Select.Option>
            <Select.Option value="telegram_awaiting">Menunggu Berbagi Lokasi</Select.Option>
          </Select>
        </div>
      </div>

      {/* Telegram Alert Users Table */}
      <div className="overflow-x-auto rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head className="whitespace-nowrap">Pengguna & Akun Telegram</Table.Head>
              <Table.Head className="whitespace-nowrap">Status Sistem Alert</Table.Head>
              <Table.Head className="whitespace-nowrap">Lokasi / Koordinat GPS</Table.Head>
              <Table.Head className="whitespace-nowrap">Bahasa & Profil</Table.Head>
              <Table.Head className="whitespace-nowrap">Terhubung (WIB)</Table.Head>
              <Table.Head className="whitespace-nowrap text-right">Aksi Peringatan</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {query.isLoading && (
              <Table.Row>
                <Table.Cell colSpan={6}>
                  <div className="flex items-center justify-center py-12 text-sm text-on-surface-variant">
                    <span className="animate-pulse">Memuat daftar pengguna Telegram bot...</span>
                  </div>
                </Table.Cell>
              </Table.Row>
            )}

            {!query.isLoading && pageRows.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={6}>
                  <div className="py-12">
                    <Empty
                      icon={<TelegramLogo size={36} className="text-on-surface-variant" />}
                      title="Tidak ada pengguna Telegram ditemukan"
                      description="Belum ada pengguna yang cocok dengan kriteria pencarian atau filter status."
                    />
                  </div>
                </Table.Cell>
              </Table.Row>
            )}

            {!query.isLoading &&
              pageRows.map((u) => {
                const isTelegramUser = !!u.telegramChatId;
                const hasLocation = u.latitude != null && u.longitude != null;
                const isAlertReady = isTelegramUser && (hasLocation || u.conversationStep === "onboarded");

                return (
                  <Table.Row key={u.id} className="transition-colors hover:bg-surface-container-low/40">
                    {/* Pengguna & Akun Telegram */}
                    <Table.Cell className="align-top">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-on-surface">{u.name}</span>
                          {isTelegramUser && (
                            <Badge variant="info" className="gap-1 text-[11px]">
                              <TelegramLogo size={12} weight="fill" />
                              Bot User
                            </Badge>
                          )}
                        </div>

                        {u.telegramUsername ? (
                          <a
                            href={`https://t.me/${u.telegramUsername}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:underline"
                          >
                            @{u.telegramUsername}
                          </a>
                        ) : isTelegramUser ? (
                          <span className="text-xs text-on-surface-variant">Tanpa username</span>
                        ) : u.whatsappNumber ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                            <WhatsappLogo size={12} weight="fill" />
                            {u.whatsappNumber}
                          </span>
                        ) : (
                          <span className="text-xs text-on-surface-variant/70">-</span>
                        )}

                        {isTelegramUser && (
                          <div className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                            <span className="font-mono">Chat ID: {u.telegramChatId}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(u.telegramChatId!)}
                              title="Salin Chat ID"
                              className="rounded p-0.5 hover:bg-surface-container"
                            >
                              {copiedId === u.telegramChatId ? (
                                <Check size={12} className="text-emerald-600" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </Table.Cell>

                    {/* Status Sistem Alert */}
                    <Table.Cell className="align-top">
                      {isAlertReady ? (
                        <div className="flex flex-col gap-1">
                          <Badge variant="success" className="w-fit gap-1 text-xs font-bold">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Siaga Peringatan
                          </Badge>
                          <span className="text-[11px] text-on-surface-variant">
                            Aktif menerima alert otomatis
                          </span>
                        </div>
                      ) : isTelegramUser ? (
                        <div className="flex flex-col gap-1">
                          <Badge variant="warning" className="w-fit gap-1 text-xs font-semibold">
                            <MapPin size={12} />
                            Menunggu Lokasi
                          </Badge>
                          <span className="text-[11px] text-on-surface-variant">
                            Belum berbagi lokasi di bot
                          </span>
                        </div>
                      ) : (
                        <Badge variant="neutral" className="w-fit text-xs">
                          Non-Telegram
                        </Badge>
                      )}
                    </Table.Cell>

                    {/* Lokasi / Koordinat GPS */}
                    <Table.Cell className="align-top">
                      {hasLocation ? (
                        <div className="flex flex-col gap-1">
                          <a
                            href={`https://www.google.com/maps?q=${u.latitude},${u.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-secondary hover:underline"
                          >
                            <MapPin size={13} weight="fill" />
                            {u.latitude?.toFixed(4)}, {u.longitude?.toFixed(4)}
                          </a>
                          <span className="text-[11px] text-on-surface-variant">
                            {u.city || "Balikpapan & Sekitarnya"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-0.5 text-xs text-on-surface-variant">
                          <span>{u.city || "Belum ada data GPS"}</span>
                          <span className="text-[11px] text-amber-600">
                            Peringatan lokal belum aktif
                          </span>
                        </div>
                      )}
                    </Table.Cell>

                    {/* Bahasa & Profil */}
                    <Table.Cell className="align-top">
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-surface-container px-1.5 py-0.5 text-[11px] font-semibold text-on-surface uppercase">
                            {u.locale || "id"}
                          </span>
                          {u.gender && (
                            <span className="text-on-surface-variant">
                              {u.gender === "male"
                                ? "Laki-laki"
                                : u.gender === "female"
                                ? "Perempuan"
                                : "Lainnya"}
                            </span>
                          )}
                        </div>
                        {u.age && (
                          <span className="text-[11px] text-on-surface-variant">
                            Usia: {u.age} th
                          </span>
                        )}
                      </div>
                    </Table.Cell>

                    {/* Terhubung (WIB) */}
                    <Table.Cell className="whitespace-nowrap align-top text-xs text-on-surface-variant">
                      {formatWIB(u.createdAt)}
                    </Table.Cell>

                    {/* Aksi Peringatan */}
                    <Table.Cell className="align-top text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUser(u)}
                        >
                          Detail
                        </Button>

                        {isTelegramUser && (
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={sendingChatId === u.telegramChatId}
                            icon={<PaperPlaneTilt size={14} />}
                            onClick={() => handleSendTestAlert(u.telegramChatId!, u.name)}
                          >
                            Uji Coba
                          </Button>
                        )}
                      </div>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
          </Table.Body>
        </Table>
      </div>

      {/* Pagination */}
      {!query.isLoading && filteredRows.length > PAGE_SIZE && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-4 text-xs text-on-surface-variant">
          <span>
            Menampilkan {(page - 1) * PAGE_SIZE + 1} -{" "}
            {Math.min(page * PAGE_SIZE, filteredRows.length)} dari {filteredRows.length} pengguna
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

      {/* User Detail Dialog */}
      <Dialog.Root
        open={selectedUser !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null);
        }}
      >
        <Dialog size="lg" className="p-6">
          {selectedUser && (
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <Dialog.Title>{selectedUser.name}</Dialog.Title>
                  <Dialog.Description>
                    Terdaftar sejak {formatWIB(selectedUser.createdAt)}
                  </Dialog.Description>
                </div>
                <div className="flex items-center gap-2">
                  {selectedUser.telegramChatId ? (
                    <Badge variant="info" className="gap-1">
                      <TelegramLogo size={14} weight="fill" />
                      Telegram
                    </Badge>
                  ) : selectedUser.whatsappNumber ? (
                    <Badge variant="success" className="gap-1">
                      <WhatsappLogo size={14} weight="fill" />
                      WhatsApp
                    </Badge>
                  ) : (
                    <Badge variant="neutral">Publik</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 rounded-2xl bg-surface-container-low p-4 sm:grid-cols-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Telegram Chat ID
                  </span>
                  <p className="font-mono text-sm font-semibold text-on-surface">
                    {selectedUser.telegramChatId || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Telegram Username
                  </span>
                  <p className="text-sm font-semibold text-on-surface">
                    {selectedUser.telegramUsername ? `@${selectedUser.telegramUsername}` : "-"}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Status Onboarding Bot
                  </span>
                  <p className="text-sm font-semibold text-on-surface">
                    {selectedUser.conversationStep || "None"}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Status Kesiapan Peringatan
                  </span>
                  <p className="text-sm font-semibold text-on-surface">
                    {selectedUser.alertStatus === "active"
                      ? "Siaga Peringatan (GPS Terhubung)"
                      : selectedUser.alertStatus === "awaiting_location"
                      ? "Menunggu Berbagi Lokasi"
                      : "Belum Terhubung"}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Koordinat Lokasi Peringatan
                </span>
                {selectedUser.latitude != null && selectedUser.longitude != null ? (
                  <div className="mt-1 flex items-center gap-2">
                    <MapPin size={16} className="text-secondary" weight="fill" />
                    <span className="font-mono text-sm font-bold text-on-surface">
                      Lat: {selectedUser.latitude}, Lon: {selectedUser.longitude}
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${selectedUser.latitude},${selectedUser.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 text-xs font-bold text-secondary underline"
                    >
                      Buka di Google Maps
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-on-surface-variant">
                    Pengguna belum membagikan koordinat GPS. Bot memerlukan koordinat untuk menghitung indeks kualitas udara lokal & radius asap.
                  </p>
                )}
              </div>

              {selectedUser.medicalHistory && selectedUser.medicalHistory.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Riwayat Medis / Kerentanan Pernapasan
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {selectedUser.medicalHistory.map((item, idx) => (
                      <Badge key={idx} variant="outline">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-2 flex justify-end gap-2 border-t border-surface-container pt-4">
                <Button variant="ghost" onClick={() => setSelectedUser(null)}>
                  Tutup
                </Button>
                {selectedUser.telegramChatId && (
                  <Button
                    variant="primary"
                    loading={sendingChatId === selectedUser.telegramChatId}
                    icon={<PaperPlaneTilt size={16} />}
                    onClick={() =>
                      handleSendTestAlert(selectedUser.telegramChatId!, selectedUser.name)
                    }
                  >
                    Kirim Pesan Uji Coba Telegram
                  </Button>
                )}
              </div>
            </div>
          )}
        </Dialog>
      </Dialog.Root>
    </div>
  );
}
