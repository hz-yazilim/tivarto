import { adminDashboardStats } from "@/actions/admin";
import StatCard from "@/components/stat-card";
import Link from "next/link";

export default async function AdminDashboard() {
  const stats = await adminDashboardStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Platform Pano</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Toplam İşletme" value={stats.tenantCount} icon="🏢" />
        <StatCard
          title="Aktif İşletme"
          value={stats.activeTenants}
          change={stats.suspendedTenants > 0 ? `${stats.suspendedTenants} askıya alınmış` : "Hepsi aktif"}
          changePositive={stats.suspendedTenants === 0}
          icon="✅"
        />
        <StatCard title="Pasif / Askıya Alınmış" value={stats.suspendedTenants} icon="😴" />
        <StatCard title="Fiyat Planı Sayısı" value={stats.planCount} icon="📋" />
        <StatCard
          title="Manuel Kaydedilen Tahsilat"
          value={stats.paymentTotal.toLocaleString("tr-TR") + " TL"}
          icon="💳"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 font-semibold">Hızlı İşlemler</h3>
          <div className="space-y-2">
            <Link href="/admin/tenants" className="block px-3 py-2 rounded-lg border hover:bg-accent text-sm">
              İşletmeleri yönet
            </Link>
            <Link href="/admin/plans" className="block px-3 py-2 rounded-lg border hover:bg-accent text-sm">
              Abonelik planlarını düzenle
            </Link>
            <Link href="/admin/payments" className="block px-3 py-2 rounded-lg border hover:bg-accent text-sm">
              Ödeme geçmişi
            </Link>
            <Link href="/admin/logs" className="block px-3 py-2 rounded-lg border hover:bg-accent text-sm">
              Sistem kayıtlarını görüntüle
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
