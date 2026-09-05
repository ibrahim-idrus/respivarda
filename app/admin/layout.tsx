"use client";

import { usePathname } from "next/navigation";
import AdminHeader from "@/src/components/admin/AdminHeader";
import AdminSidebar from "@/src/components/admin/AdminSidebar";

const TITLES: [prefix: string, title: string][] = [
  ["/admin/feedback", "Laporan Masukan"],
  ["/admin/console", "Konsol Pengguna"],
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const title = TITLES.find(([p]) => pathname.startsWith(p))?.[1] ?? "Admin";

  return (
    <div className="flex min-h-dvh bg-surface">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader title={title} />
        <main className="min-w-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
