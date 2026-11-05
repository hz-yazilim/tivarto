"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Package, Boxes, Layers, Truck, Users, Building2,
  ShoppingCart, Settings, LogOut, UserCircle, Menu, X, Store, LifeBuoy,
  UserCog, BarChart3, Sparkles,
} from "lucide-react";
import { classNames } from "./ui/utils";

const NAV = [
  { name: "Pano", href: "/panel", icon: LayoutDashboard },
  { name: "Ürünler", href: "/panel/products", icon: Package },
  { name: "Kategoriler", href: "/panel/categories", icon: Layers },
  { name: "Stok", href: "/panel/stock", icon: Boxes },
  { name: "Mal Kabulü", href: "/panel/receipts", icon: Truck },
  { name: "Müşteriler", href: "/panel/customers", icon: Users },
  { name: "Tedarikçiler", href: "/panel/suppliers", icon: Building2 },
  { name: "Siparişler", href: "/panel/orders", icon: ShoppingCart },
  { name: "Akıllı Analiz", href: "/panel/akilli-analiz", icon: Sparkles },
  { name: "Raporlar", href: "/panel/reports", icon: BarChart3 },
  { name: "Destek", href: "/panel/support", icon: LifeBuoy },
  { name: "Ekip", href: "/panel/team", icon: UserCog, ownerOnly: true },
  { name: "Ayarlar", href: "/panel/settings", icon: Settings, ownerOnly: true },
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
    <nav className="flex-none space-y-1 overflow-y-auto px-2" aria-label="Ana menü">
      {NAV.filter((item) => !("ownerOnly" in item) || role === "OWNER").map((item) => {
        const isActive = pathname === item.href ||
          (item.href !== "/panel" && pathname.startsWith(item.href + "/"));
        return (
          <Link key={item.name} href={item.href} onClick={() => setOpen(false)}
            className={classNames(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "bg-primary text-primary-foreground" :
                "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}>
            <item.icon className="h-5 w-5 shrink-0" />{item.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <div className="fixed inset-x-0 top-[calc(env(safe-area-inset-top)+8px)] z-40 flex items-center justify-between border-b border-border bg-card px-4 py-2 md:hidden">
        <button type="button" onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-md border border-input px-2 py-1 text-sm"
          aria-label="Menüyü aç">
          <Menu className="h-4 w-4" /> Menü
        </button>
        <span className="truncate text-sm font-semibold">{tenant.name}</span>
      </div>
      <div className="h-[calc(3rem+env(safe-area-inset-top)+8px)] md:hidden" />

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col overflow-y-auto bg-card pt-[calc(env(safe-area-inset-top)+8px)]">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{tenant.name}</div>
                <div className="truncate text-xs text-muted-foreground">{tenant.slug}</div>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Menüyü kapat">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            <SidebarFooter slug={tenant.slug} isAdmin={user.isPlatformAdmin} />
          </aside>
        </div>
      )}

      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex items-center gap-3 px-4 py-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">T</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{tenant.name}</div>
            <div className="truncate text-xs text-muted-foreground">{tenant.slug}</div>
          </div>
        </div>
        {nav}
        <SidebarFooter slug={tenant.slug} isAdmin={user.isPlatformAdmin} />
      </aside>
    </>
  );
}

function SidebarFooter({ slug, isAdmin }: { slug: string; isAdmin: boolean }) {
  return (
    <div className="space-y-1 border-t border-border px-2 py-3">
      <Link href="/hesabim" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
        <UserCircle className="h-5 w-5 shrink-0" /> Hesabım ve verilerim
      </Link>
      <Link href="/panel-secimi" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
        <Building2 className="h-5 w-5 shrink-0" /> İşletme değiştir
      </Link>
      <Link href={"/shop/" + slug} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
        <Store className="h-5 w-5 shrink-0" /> Vitrini Gör
      </Link>
      {isAdmin ? (
        <Link href="/admin" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          <LayoutDashboard className="h-5 w-5 shrink-0" /> Platform Paneli
        </Link>
      ) : null}
      <a href="/logout" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
        <LogOut className="h-5 w-5 shrink-0" /> Çıkış Yap
      </a>
    </div>
  );
}
