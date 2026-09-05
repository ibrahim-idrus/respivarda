"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, Pagination, Select, Table } from "@cloudflare/kumo";

const PAGE_SIZE = 10;

type UserRow = {
  id: string;
  name: string;
  whatsappNumber: string | null;
  telegramChatId: string | null;
  telegramUsername: string | null;
  createdAt: string;
  city: string | null;
  gender: "male" | "female" | "other" | null;
};

const GENDER_LABEL: Record<NonNullable<UserRow["gender"]>, string> = {
  male: "Laki-laki",
  female: "Perempuan",
  other: "Lainnya",
};

function channelBadge(u: UserRow) {
  const wa = !!u.whatsappNumber;
  const tg = !!u.telegramChatId;
  if (wa && tg) return <Badge variant="success">Keduanya</Badge>;
  if (wa) return <Badge variant="success">WhatsApp</Badge>;
  if (tg) return <Badge variant="info">Telegram</Badge>;
  return <Badge variant="neutral">Tidak ada</Badge>;
}

export default function UserRegistry() {
  const [page, setPage] = useState(1);
  const [gender, setGender] = useState("all");
  const [district, setDistrict] = useState("all");

  const query = useQuery<{ data: UserRow[]; total: number }>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Gagal memuat pengguna");
      return res.json();
    },
  });

  // ponytail: filters + pagination are client-side over a ≤100-row API cap.
  // ceiling: with >100 users the unseen rows can't match filters or be
  // paged to. upgrade: push filters/page into /api/admin/users query params.
  const rows = useMemo(() => query.data?.data ?? [], [query.data]);
  const districts = useMemo(
    () =>
      [...new Set(rows.map((r) => r.city).filter((c): c is string => !!c))].sort(),
    [rows],
  );
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (gender === "all" || r.gender === gender) &&
          (district === "all" || r.city === district),
      ),
    [rows, gender, district],
  );
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
          Registri Pengguna
        </h2>
        <div className="flex gap-3">
          <Select
            label="Distrik"
            size="sm"
            value={district}
            onValueChange={(v: string | null) => {
              setDistrict(v ?? "all");
              setPage(1);
            }}
          >
            <Select.Option value="all">Semua Distrik</Select.Option>
            {districts.map((d) => (
              <Select.Option key={d} value={d}>
                {d}
              </Select.Option>
            ))}
          </Select>
          <Select
            label="Jenis Kelamin"
            size="sm"
            value={gender}
            onValueChange={(v: string | null) => {
              setGender(v ?? "all");
              setPage(1);
            }}
          >
            <Select.Option value="all">Semua</Select.Option>
            <Select.Option value="male">Laki-laki</Select.Option>
            <Select.Option value="female">Perempuan</Select.Option>
            <Select.Option value="other">Lainnya</Select.Option>
          </Select>
        </div>
      </div>

      {query.isError && (
        <p className="text-sm text-error">Gagal memuat registri pengguna.</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>Nama</Table.Head>
              <Table.Head>Kanal</Table.Head>
              <Table.Head>Distrik</Table.Head>
              <Table.Head>Jenis Kelamin</Table.Head>
              <Table.Head>Bergabung</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {pageRows.map((u) => (
              <Table.Row key={u.id}>
                <Table.Cell>
                  <div className="flex flex-col">
                    <span className="font-medium">{u.name}</span>
                    <span className="text-[12px] text-on-surface-variant">
                      {u.whatsappNumber ??
                        (u.telegramUsername ? `@${u.telegramUsername}` : "-")}
                    </span>
                  </div>
                </Table.Cell>
                <Table.Cell>{channelBadge(u)}</Table.Cell>
                <Table.Cell>{u.city ?? "-"}</Table.Cell>
                <Table.Cell>
                  {u.gender ? GENDER_LABEL[u.gender] : "-"}
                </Table.Cell>
                <Table.Cell>
                  {new Intl.DateTimeFormat("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(u.createdAt))}
                </Table.Cell>
              </Table.Row>
            ))}
            {!query.isLoading && pageRows.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={5}>
                  <span className="block py-6 text-center text-sm text-on-surface-variant">
                    Tidak ada pengguna yang cocok dengan filter.
                  </span>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </div>

      <Pagination
        page={page}
        setPage={setPage}
        perPage={PAGE_SIZE}
        totalCount={filtered.length}
      >
        <Pagination.Info />
        <Pagination.Controls />
      </Pagination>
    </div>
  );
}
