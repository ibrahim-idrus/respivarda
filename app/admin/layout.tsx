"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider } from "@cloudflare/kumo";
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
  const isLoginPage = pathname === "/admin/login" || pathname.startsWith("/admin/login/");
  const title = TITLES.find(([p]) => pathname.startsWith(p))?.[1] ?? "Admin";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider variant="sidebar" collapsible="none">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col bg-surface min-h-dvh">
        <AdminHeader title={title} />
        <main className="min-w-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </SidebarProvider>
  );
}
