"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, X } from "@phosphor-icons/react";

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isFeedback = pathname === "/feedback";

  return (
    <header className="fixed top-0 z-50 w-full border-b border-surface-container bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
          <div className="leading-tight text-left">
            <p className="text-base font-extrabold tracking-tight">Respivarda</p>
            <p className="text-[11px] font-medium text-on-surface-variant">Monitoring Kualitas Udara</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-semibold md:flex">
          <Link
            href="/"
            className={`rounded-full px-3 py-1.5 transition-colors ${isHome ? "bg-secondary-container text-on-secondary-container" : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"}`}
          >
            Beranda
          </Link>
          <Link
            href="/feedback"
            className={`rounded-full px-3 py-1.5 transition-colors ${isFeedback ? "bg-secondary-container text-on-secondary-container" : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"}`}
          >
            Masukan
          </Link>
        </nav>

        <button
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-surface-container bg-white text-on-surface shadow-sm md:hidden"
        >
          {open ? <X size={18} /> : <List size={18} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-surface-container bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1 text-sm font-semibold">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className={`rounded-xl px-3 py-2.5 ${isHome ? "bg-secondary-container text-on-secondary-container" : "text-on-surface hover:bg-surface-container-low"}`}
            >
              Beranda
            </Link>
            <Link
              href="/feedback"
              onClick={() => setOpen(false)}
              className={`rounded-xl px-3 py-2.5 ${isFeedback ? "bg-secondary-container text-on-secondary-container" : "text-on-surface hover:bg-surface-container-low"}`}
            >
              Masukan
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
