"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@cloudflare/kumo";
import { Sidebar, SidebarProvider } from "@cloudflare/kumo";
import {
  ArrowLeft,
  ChatCircleText,
  Fire,
  Gauge,
  ShieldCheck,
  SignOut,
  UsersThree,
} from "@phosphor-icons/react";

const NAV = [
  { label: "Ikhtisar", href: null, icon: Gauge }, // disabled — not in scope
  { label: "Laporan Masukan", href: "/admin/feedback", icon: ChatCircleText },
  { label: "Konsol Pengguna", href: "/admin/console", icon: UsersThree },
  { label: "Log Audit", href: null, icon: ShieldCheck }, // disabled — not in scope
] as const;

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch {
      // Proceed to login
    }
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <SidebarProvider variant="sidebar" collapsible="none" contained>
      <Sidebar className="flex flex-col justify-between">
        <div>
          <Sidebar.Header className="p-4">
            <div className="flex items-center gap-2">
              <Fire size={22} weight="fill" className="text-primary" />
              <span className="text-base font-bold tracking-tight text-on-surface">
                Respivarda
              </span>
              <Badge variant="neutral">ADMIN</Badge>
            </div>
          </Sidebar.Header>
          <Sidebar.Content>
            <Sidebar.Group>
              <Sidebar.GroupLabel>Administrasi</Sidebar.GroupLabel>
              <Sidebar.Menu>
                {NAV.map((item) =>
                  item.href ? (
                    <Sidebar.MenuButton
                      key={item.label}
                      href={item.href}
                      icon={<item.icon weight="regular" />}
                      active={pathname.startsWith(item.href)}
                    >
                      {item.label}
                    </Sidebar.MenuButton>
                  ) : (
                    <Sidebar.MenuButton
                      key={item.label}
                      icon={<item.icon weight="regular" />}
                      disabled
                      aria-disabled
                    >
                      {item.label}
                    </Sidebar.MenuButton>
                  ),
                )}
              </Sidebar.Menu>
            </Sidebar.Group>

            <Sidebar.Group className="mt-8">
              <Sidebar.GroupLabel>Sistem</Sidebar.GroupLabel>
              <Sidebar.Menu>
                <Sidebar.MenuButton
                  href="/"
                  icon={<ArrowLeft weight="regular" />}
                >
                  Beranda Publik
                </Sidebar.MenuButton>
                <Sidebar.MenuButton
                  onClick={handleLogout}
                  icon={<SignOut weight="regular" />}
                  disabled={loggingOut}
                >
                  {loggingOut ? "Mengeluarkan..." : "Keluar"}
                </Sidebar.MenuButton>
              </Sidebar.Menu>
            </Sidebar.Group>
          </Sidebar.Content>
        </div>
      </Sidebar>
    </SidebarProvider>
  );
}
