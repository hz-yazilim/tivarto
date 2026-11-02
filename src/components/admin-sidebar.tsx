"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  ScrollText,
  LogOut,
  Menu,
  X,
  ArrowLeftRight,
} from "lucide-react";
import { classNames } from "./ui/utils";

const NAV = [
  { name: "Pano", href: "/admin", icon: LayoutDashboard },
  { name: "İşletmeler", href: "/admin/tenants", icon: Building2 },
  { name: "Planlar", href: "/admin/plans", icon: CreditCard },
  { name: "Ödemeler", href: "/admin/payments", icon: CreditCard },
  { name: "Kayıtlar", href: "/admin/logs", icon: ScrollText },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex-1 space-y-1 px-2" aria-label="Yönetici menüsü">
      {NAV.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setOpen(false)}
            className={classNames(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="space-y-1 border-t border-border px-2 py-3">
      <Link
        href="/panel"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <ArrowLeftRight className="h-5 w-5 shrink-0" /> İşletme Paneli
      </Link>
      <a
        href="/logout"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <LogOut className="h-5 w-5 shrink-0" /> Çıkış Yap
      </a>
    </div>
  );

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-border bg-card px-4 py-2 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-md border border-input px-2 py-1 text-sm"
          aria-label="Menüyü aç"
        >
          <Menu className="h-4 w-4" /> Menü
        </button>
        <span className="text-sm font-semibold">Platform</span>
      </div>
      <div className="h-12 md:hidden" />

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-card">
            <div className="flex items-center justify-between px-4 py-4">
              <span className="text-sm font-semibold">Tivarto Yönetim</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Menüyü kapat">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      )}

      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex items-center gap-3 px-4 py-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            T
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">Tivarto</div>
            <div className="truncate text-xs text-muted-foreground">
              Platform Yönetimi
            </div>
          </div>
        </div>
        {nav}
        {footer}
      </aside>
    </>
  );
}
