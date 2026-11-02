"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Box,
  Truck,
  Users,
  Building2,
  ShoppingCart,
  Settings,
  LogOut,
} from "lucide-react";
import { classNames } from "./ui/utils";

const NAV = [
  { name: "Pano", href: "/panel", icon: LayoutDashboard },
  { name: "Ürünler", href: "/panel/products", icon: Package },
  { name: "Kategoriler", href: "/panel/categories", icon: Box },
  { name: "Stok", href: "/panel/stock", icon: Box },
  { name: "Mal Kabulü", href: "/panel/receipts", icon: Truck },
  { name: "Müşteriler", href: "/panel/customers", icon: Users },
  { name: "Tedarikçiler", href: "/panel/suppliers", icon: Building2 },
  { name: "Siparişler", href: "/panel/orders", icon: ShoppingCart },
  { name: "Ayarlar", href: "/panel/settings", icon: Settings },
];

export default function PanelSidebar({ tenant }: { tenant: { name: string; slug: string } }) {
  const pathname = usePathname();

  return (
    <aside className="flex-shrink-0 w-64 border-r border-border bg-card hidden md:flex flex-col">
      <div className="flex items-center gap-3 px-4 py-6">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
          T
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{tenant.name}</div>
          <div className="text-xs text-muted-foreground truncate">{tenant.slug}</div>
        </div>
      </div>

      <nav className="flex-1 px-2 space-y-1" aria-label="Ana menü">
        {NAV.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
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

      <div className="px-4 py-4 border-t border-border">
        <form action="/logout" method="get" className="w-full">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" /> Çıkış Yap
          </button>
        </form>
      </div>
    </aside>
  );
}
