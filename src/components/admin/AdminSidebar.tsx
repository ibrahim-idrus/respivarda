"use client";

import { usePathname } from "next/navigation";
import { Badge } from "@cloudflare/kumo";
import { Sidebar, SidebarProvider } from "@cloudflare/kumo";
import {
  ChatCircleText,
  Fire,
  Gauge,
  ShieldCheck,
  UsersThree,
} from "@phosphor-icons/react";

const NAV = [
  { label: "Ikhtisar", href: null, icon: Gauge }, // disabled — not in scope
  { label: "Laporan Masukan", href: "/admin/feedback", icon: ChatCircleText },
  { label: "Konsol Pengguna", href: "/admin/console", icon: UsersThree },
  { label: "Log Audit", href: null, icon: ShieldCheck }, // disabled — not in scope
] as const;

// ponytail: "Log Audit"/"Ikhtisar" render disabled (no route). ceiling: dead
// nav items. upgrade: build those pages or remove items per scope review.
export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    // ponytail: own SidebarProvider scoped to /admin layout — ceiling: second
    // provider in tree (fine, app shell has none). contained to admin area.
    <SidebarProvider variant="sidebar" collapsible="none" contained>
      <Sidebar>
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
        </Sidebar.Content>
      </Sidebar>
    </SidebarProvider>
  );
}
