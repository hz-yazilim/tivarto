import { getTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";
import StatCard from "@/components/stat-card";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const { tenant, user } = await getTenantContext();

  const stats = await withTenant(tenant.id, async (tx) => {
    const [products, orders, customers, revenue, recentOrders, lowStock] =
      await Promise.all([
        tx.product.count(),
        tx.order.count(),
        tx.customer.count(),
        tx.order.aggregate({
          where: { status: { not: "CANCELLED" } },
          _sum: { total: true },
        }),
        tx.order.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            customerName: true,
            status: true,
            total: true,
            createdAt: true,
          },
        }),
        tx.product.findMany({
          where: { isActive: true },
          select: { id: true, name: true, stock: true, minStock: true },
          orderBy: { stock: "asc" },
          take: 50,
        }),
      ]);

    return {
      products,
      orders,
      customers,
      revenue: Number(revenue._sum.total ?? 0),
      recentOrders,
      critical: lowStock.filter((p) => p.stock <= p.minStock),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pano</h1>
          <p className="text-sm text-muted-foreground">
            İşletmenizin genel durumu ({tenant.name})
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Giriş yapan: <span className="font-medium">{user.name ?? user.email}</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Toplam Ürün" value={stats.products} icon="📦" />
        <StatCard
          title="Kritik Stok"
          value={stats.critical.length}
          change={
            stats.critical.length > 0 ? "Düşük stokta ürün var" : "Stok yeterli"
          }
          changePositive={stats.critical.length === 0}
          icon="📉"
        />
        <StatCard title="Toplam Sipariş" value={stats.orders} icon="🛒" />
        <StatCard
          title="Sipariş Tutarı"
          value={`${stats.revenue.toLocaleString("tr-TR")} TL`}
          icon="₺"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Son Siparişler</h2>
            <Link
              href="/panel/orders"
              className="text-xs text-primary hover:underline"
            >
              Tümü
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentOrders.length > 0 ? (
              stats.recentOrders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between border-b pb-2 text-sm last:border-0"
                >
                  <div>
                    <div className="font-medium">#{o.id.slice(-6)}</div>
                    <div className="text-xs text-muted-foreground">
                      {o.customerName}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${statusColor(
                        o.status
                      )}`}
                    >
                      {statusLabel(o.status)}
                    </span>
                    <div className="font-medium">
                      {Number(o.total).toLocaleString("tr-TR")} TL
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Henüz sipariş yok.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 font-semibold">Kritik Stok</h2>
            <div className="space-y-2 text-sm">
              {stats.critical.length > 0 ? (
                stats.critical.slice(0, 6).map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <span className="truncate">{p.name}</span>
                    <span className="font-semibold text-red-600">
                      {p.stock} / {p.minStock}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">
                  Kritik stokta ürün bulunmuyor.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 font-semibold">Hızlı İşlemler</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              <QuickLink href="/panel/products">📦 Ürün Ekle</QuickLink>
              <QuickLink href="/panel/stock">🔄 Stok Girişi</QuickLink>
              <QuickLink href="/panel/receipts">🚚 Mal Kabul</QuickLink>
              <QuickLink href={`/shop/${tenant.slug}`}>🛍️ Vitrini Aç</QuickLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-input px-3 py-2 text-sm hover:bg-accent"
    >
      {children}
    </Link>
  );
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    NEW: "Yeni",
    CONFIRMED: "Onaylandı",
    PREPARING: "Hazırlanıyor",
    COMPLETED: "Tamamlandı",
    CANCELLED: "İptal",
  };
  return map[s] ?? s;
}

function statusColor(s: string) {
  const map: Record<string, string> = {
    NEW: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    PREPARING: "bg-orange-100 text-orange-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return map[s] ?? "bg-muted text-muted-foreground";
}
