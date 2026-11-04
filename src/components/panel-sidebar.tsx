"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Package, Boxes, Layers, Truck, Users, Building2,
  ShoppingCart, Settings, LogOut, Menu, X, Store, LifeBuoy, UserCog,
  BarChart3, Sparkles,
} from "lucide-react";
import { classNames } from "./ui/utils";

const NAV = [
  { name: "Genel Bakış", href: "/panel", icon: LayoutDashboard },
  { name: "Ürünler", href: "/panel/products", icon: Package },
  { name: "Kategoriler", href: "/panel/categories", icon: Layers },
  { name: "Stok Yönetimi", href: "/panel/stock", icon: Boxes },
  { name: "Mal Kabulü", href: "/panel/receipts", icon: Truck },
  { name: "Müşteriler", href: "/panel/customers", icon: Users },
  { name: "Tedarikçiler", href: "/panel/suppliers", icon: Building2 },
  { name: "Siparişler", href: "/panel/orders", icon: ShoppingCart },
  { name: "Akıllı Analiz", href: "/panel/akilli-analiz", icon: Sparkles },
  { name: "Raporlar", href: "/panel/reports", icon: BarChart3 },
  { name: "Destek Merkezi", href: "/panel/support", icon: LifeBuoy },
  { name: "Ekip Yönetimi", href: "/panel/team", icon: UserCog, ownerOnly: true },
  { name: "İşletme Ayarları", href: "/panel/settings", icon: Settings, ownerOnly: true },
];

export default function PanelSidebar({
  tenant, user, role,
}: {
  tenant: { name: string; slug: string };
  user: { name: string; isPlatformAdmin: boolean };
  role: "OWNER" | "STAFF";
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-3" aria-label="Ana menü">
      {NAV.filter((item) => !("ownerOnly" in item) || role === "OWNER").map((item) => {
        const isActive = pathname === item.href || (item.href !== "/panel" && pathname.startsWith(item.href + "/"));
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

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 flex h-12 items-center justify-between border-b border-border/80 bg-card/95 px-3 shadow-sm backdrop-blur-xl md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-input px-3 text-xs font-semibold"
          aria-label="Menüyü aç"
          aria-expanded={open}
        >
          <Menu className="h-4 w-4" /> Menü
        </button>
        <span className="max-w-[62vw] truncate text-xs font-semibold">{tenant.name}</span>
        <span className="h-2 w-2 rounded-full bg-emerald-400" aria-label="İşletme paneli" />
      </div>
      <div className="h-12 shrink-0 md:hidden" />

      {open && (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="İşletme menüsü">
          <button className="absolute inset-0 h-full w-full bg-black/65 backdrop-blur-[2px]" onClick={() => setOpen(false)} aria-label="Menüyü kapat" />
          <aside className="absolute inset-y-0 left-0 flex w-[min(86vw,304px)] flex-col border-r border-white/10 bg-[#120d1c] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="tiverto-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white">T</div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{tenant.name}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{tenant.slug}</div>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Menüyü kapat" className="rounded-lg p-2 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-4 pb-2 pt-4 text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">İşletme menüsü</div>
            {nav}
            <SidebarFooter slug={tenant.slug} isAdmin={user.isPlatformAdmin} />
          </aside>
        </div>
      )}

      <aside className="hidden w-[15rem] shrink-0 flex-col border-r border-border/80 bg-card/90 md:flex xl:w-[16rem]">
        <div className="flex items-center gap-3 border-b border-border/70 px-4 py-5">
          <div className="tiverto-gradient flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black text-white shadow-lg shadow-purple-950/30">T</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{tenant.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">{tenant.slug}</div>
          </div>
        </div>
        <div className="px-4 pb-2 pt-4 text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">Çalışma alanı</div>
        {nav}
        <SidebarFooter slug={tenant.slug} isAdmin={user.isPlatformAdmin} />
      </aside>
    </>
  );
}

function SidebarFooter({ slug, isAdmin }: { slug: string; isAdmin: boolean }) {
  return (
    <div className="space-y-1 border-t border-border/80 px-2 py-3">
      <Link href="/panel-secimi" className="flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
        <Building2 className="h-[18px] w-[18px] shrink-0" /> İşletme değiştir
      </Link>
      <Link href={"/shop/" + slug} className="flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
        <Store className="h-[18px] w-[18px] shrink-0" /> Dijital vitrini gör
      </Link>
      {isAdmin ? (
        <Link href="/admin" className="flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          <LayoutDashboard className="h-[18px] w-[18px] shrink-0" /> Platform yönetimi
        </Link>
      ) : null}
      <a href="/logout" className="flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
        <LogOut className="h-[18px] w-[18px] shrink-0" /> Güvenli çıkış
      </a>
    </div>
  );
}
