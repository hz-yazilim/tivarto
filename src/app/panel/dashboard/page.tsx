import { getTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";
import StatCard from "@/components/stat-card";

export default async function Dashboard() {
  const { tenant, user } = await getTenantContext();

  const stats = await withTenant(tenant.id, async (tx) => {
    const [products, orders, customers, movements] = await Promise.all([
      tx.product.count(),
      tx.order.count(),
      tx.customer.count(),
      tx.stockMovement.count(),
    ]);

    const productsWithMin = await tx.product.findMany({
      where: { isActive: true },
      select: { id: true, stock: true, minStock: true },
    });
    const low = productsWithMin.filter((p: any) => p.stock <= p.minStock).length;

    const recentOrders = await tx.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });

    return { products, lowStock: low, orders, customers, movements, recentOrders };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pano</h1>
          <p className="text-muted-foreground text-sm">
            İşletmenizin genel durumu ({tenant.name})
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          Giriş yapan: <span className="font-medium">{user.name}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Toplam Ürün" value={stats.products} icon="📦" />
        <StatCard
          title="Kritik Stok"
          value={stats.lowStock}
          change={stats.lowStock > 0 ? "Düşük stokta ürün var" : "Stok yeterli"}
          changePositive={stats.lowStock === 0}
          icon="📉"
        />
        <StatCard title="Toplam Sipariş" value={stats.orders} icon="🛒" />
        <StatCard title="Müşteri Sayısı" value={stats.customers} icon="👥" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-3 font-semibold">Son Siparişler</h3>
          <div className="space-y-3">
            {stats.recentOrders.length > 0 ? (
              stats.recentOrders.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                  <div>
                    <div className="font-medium">#{o.id.slice(-6)}</div>
                    <div className="text-xs text-muted-foreground">{o.customerName}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor(o.status)}`}>
                      {statusLabel(o.status)}
                    </span>
                    <div className="font-medium">{o.total.toLocaleString("tr-TR")} TL</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Henüz sipariş yok.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-3 font-semibold">Hızlı İşlemler</h3>
          <div className="space-y-2">
            <a href="/panel/products" className="block px-3 py-2 rounded-lg border hover:bg-accent text-sm">Ürün Ekle / Düzenle</a>
            <a href="/panel/stock" className="block px-3 py-2 rounded-lg border hover:bg-accent text-sm">Stok Girişi / Çıkışı</a>
            <a href="/panel/receipts" className="block px-3 py-2 rounded-lg border hover:bg-accent text-sm">Yeni Mal Kabul Kaydı</a>
            <a href="/panel/orders" className="block px-3 py-2 rounded-lg border hover:bg-accent text-sm">Siparişleri Görüntüle</a>
            <a href="/panel/settings" className="block px-3 py-2 rounded-lg border hover:bg-accent text-sm">Mağaza Ayarları</a>
          </div>
        </div>
      </div>
    </div>
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
  return map[s] || s;
}

function statusColor(s: string) {
  const map: Record<string, string> = {
    NEW: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    PREPARING: "bg-orange-100 text-orange-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return map[s] || "bg-muted text-muted-foreground";
}
