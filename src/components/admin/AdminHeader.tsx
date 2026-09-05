"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button } from "@cloudflare/kumo";
import { ArrowsClockwise, SignOut, UserCircle } from "@phosphor-icons/react";

export default function AdminHeader({ title }: { title: string }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch {
      // Proceed to login anyway
    }
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-6">
      <h1 className="text-lg font-bold tracking-tight text-on-surface">
        {title}
      </h1>
      <div className="flex items-center gap-4">
        <span className="hidden items-center gap-1.5 text-[12px] text-on-surface-variant sm:flex">
          <ArrowsClockwise size={14} />
          Sinkronisasi: Aktif
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <UserCircle size={28} className="text-on-surface-variant" />
            <div className="hidden flex-col leading-tight sm:flex">
              <span className="text-[13px] font-semibold text-on-surface">
                Admin
              </span>
              <Badge variant="neutral">Administrator</Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            loading={loggingOut}
            icon={<SignOut size={16} />}
            onClick={handleLogout}
            className="text-on-surface-variant hover:text-error"
          >
            Keluar
          </Button>
        </div>
      </div>
    </header>
  );
}
