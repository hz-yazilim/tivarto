"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { classNames } from "./ui/utils";

const NAV = [
  { name: "Pano", href: "/admin", icon: "📊" },
  { name: "İşletmeler", href: "/admin/tenants", icon: "🏢" },
  { name: "Planlar", href: "/admin/plans", icon: "📋" },
  { name: "Ödemeler", href: "/admin/payments", icon: "💳" },
  { name: "Kayıtlar", href: "/admin/logs", icon: "🧾" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex-shrink-0 w-64 border-r border-border bg-card hidden md:flex flex-col">
      <div className="flex items-center gap-3 px-4 py-6">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
          T
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">Tivarto</div>
          <div className="text-xs text-muted-foreground truncate">
            Platform Yönetimi
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 space-y-1" aria-label="Yönetici menüsü">
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
              {item.icon} {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-border">
        <form action="/logout" method="get" className="w-full">
          <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors">
            🚪 Çıkış Yap
          </button>
        </form>
      </div>
    </aside>
  );
}
