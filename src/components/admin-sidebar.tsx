"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Building2, CreditCard, ScrollText, LogOut, Menu, X,
  Users, Flag, LifeBuoy, Activity,
} from "lucide-react";
import { classNames } from "./ui/utils";

const NAV = [
  { name: "Genel Bakış", href: "/admin", icon: LayoutDashboard },
  { name: "İşletmeler", href: "/admin/tenants", icon: Building2 },
  { name: "Kullanıcılar", href: "/admin/users", icon: Users },
  { name: "Planlar", href: "/admin/plans", icon: CreditCard },
  { name: "Ödemeler", href: "/admin/payments", icon: CreditCard },
  { name: "Özellik yönetimi", href: "/admin/features", icon: Flag },
  { name: "Destek merkezi", href: "/admin/support", icon: LifeBuoy },
  { name: "Sistem sağlığı", href: "/admin/health", icon: Activity },
  { name: "İşlem kayıtları", href: "/admin/logs", icon: ScrollText },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-3" aria-label="Yönetici menüsü">
      {NAV.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={isActive ? "page" : undefined}
            className={classNames(
              "flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-md shadow-purple-950/30"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
            <span className="truncate">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-border/80 px-2 py-3">
      <a href="/logout" className="flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
        <LogOut className="h-[18px] w-[18px] shrink-0" /> Güvenli çıkış
      </a>
    </div>
  );

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 flex h-12 items-center justify-between border-b border-border/80 bg-card/95 px-3 shadow-sm backdrop-blur-xl md:hidden">
        <button type="button" onClick={() => setOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-input px-3 text-xs font-semibold" aria-label="Yönetici menüsünü aç" aria-expanded={open}>
          <Menu className="h-4 w-4" /> Menü
        </button>
        <span className="text-xs font-semibold">Tivarto · Yönetim</span>
        <span className="h-2 w-2 rounded-full bg-emerald-400" aria-label="Yönetim paneli" />
      </div>
      <div className="h-12 shrink-0 md:hidden" />

      {open && (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="Platform yönetim menüsü">
          <button className="absolute inset-0 h-full w-full bg-black/65 backdrop-blur-[2px]" onClick={() => setOpen(false)} aria-label="Menüyü kapat" />
          <aside className="absolute inset-y-0 left-0 flex w-[min(86vw,304px)] flex-col border-r border-white/10 bg-[#120d1c] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="tiverto-gradient flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black text-white">T</div>
                <div>
                  <div className="text-sm font-semibold">Tivarto</div>
                  <div className="text-[11px] text-muted-foreground">Platform yönetimi</div>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Menüyü kapat" className="rounded-lg p-2 hover:bg-white/10"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-4 pb-2 pt-4 text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">Yönetim alanı</div>
            {nav}
            {footer}
          </aside>
        </div>
      )}

      <aside className="hidden w-[15rem] shrink-0 flex-col border-r border-border/80 bg-card/90 md:flex xl:w-[16rem]">
        <div className="flex items-center gap-3 border-b border-border/70 px-4 py-5">
          <div className="tiverto-gradient flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black text-white shadow-lg shadow-purple-950/30">T</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">Tivarto</div>
            <div className="truncate text-[11px] text-muted-foreground">Platform yönetimi</div>
          </div>
        </div>
        <div className="px-4 pb-2 pt-4 text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">Yönetim alanı</div>
        {nav}
        {footer}
      </aside>
    </>
  );
}
