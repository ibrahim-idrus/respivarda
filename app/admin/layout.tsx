"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  const router = useRouter();

  const isLoginPage = pathname === "/admin/login" || pathname.startsWith("/admin/login/");
  const title = TITLES.find(([p]) => pathname.startsWith(p))?.[1] ?? "Admin";

  const [checking, setChecking] = useState(!isLoginPage);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (isLoginPage) {
      return;
    }

    let active = true;
    fetch("/api/admin/auth/me")
      .then((res) => {
        if (!active) return;
        if (res.ok) {
          setAuthenticated(true);
          setChecking(false);
        } else {
          setAuthenticated(false);
          setChecking(false);
          router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
        }
      })
      .catch(() => {
        if (!active) return;
        setAuthenticated(false);
        setChecking(false);
        router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
      });

    return () => {
      active = false;
    };
  }, [pathname, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
          <span className="text-sm font-medium text-on-surface-variant">
            Memverifikasi sesi admin...
          </span>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

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
