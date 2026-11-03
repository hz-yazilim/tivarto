import { adminDashboardStats } from "@/actions/admin";
import StatCard from "@/components/stat-card";
import Link from "next/link";
import { Activity, ArrowUpRight, Building2, CreditCard, ScrollText, Users, Layers3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const stats = await adminDashboardStats();

  const shortcuts = [
    { href: "/admin/tenants", title: "İşletmeler", description: "Hesapları, durumları ve plan atamalarını yönet", icon: Building2 },
    { href: "/admin/plans", title: "Abonelik planları", description: "Paket limitlerini ve aylık fiyatları düzenle", icon: Layers3 },
    { href: "/admin/payments", title: "Ödemeler", description: "Manuel tahsilat kayıtlarını ve geçmişi görüntüle", icon: CreditCard },
    { href: "/admin/logs", title: "Denetim kayıtları", description: "Platform ve işletme etkinliklerini incele", icon: ScrollText },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-purple-300">TİVERTO / MERKEZ YÖNETİM</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Genel Bakış</h1>
          <p className="mt-1 text-sm text-muted-foreground">Platformdaki işletmeleri, kullanıcıları ve tahsilat kayıtlarını tek noktadan takip edin.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
          <Activity className="h-3.5 w-3.5" /> Yönetim oturumu aktif
        </div>
      </div>

      <section aria-label="Platform istatistikleri" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Toplam işletme" value={stats.tenantCount} icon="🏢" />
        <StatCard title="Aktif işletme" value={stats.activeTenants} change={stats.suspendedTenants > 0 ? `${stats.suspendedTenants} askıya alınmış` : "Tüm işletmeler aktif"} changePositive={stats.suspendedTenants === 0} icon="✓" />
        <StatCard title="Askıya alınmış işletme" value={stats.suspendedTenants} icon="⏸" />
        <StatCard title="Kayıtlı kullanıcı" value={stats.userCount} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Tanımlı plan" value={stats.planCount} icon="▤" />
        <StatCard title="Kaydedilmiş tahsilat" value={stats.paymentTotal.toLocaleString("tr-TR") + " TL"} icon="₺" />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Yönetim modülleri</h2>
            <p className="mt-1 text-sm text-muted-foreground">Mevcut platform işlemlerine hızlı erişim.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {shortcuts.map((item) => (
            <Link key={item.href} href={item.href} className="group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-purple-400/40 hover:bg-accent/50">
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-200"><item.icon className="h-5 w-5" /></span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-purple-200" />
              </div>
              <h3 className="mt-4 font-semibold">{item.title}</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] p-5">
        <h2 className="font-semibold text-rose-100">Operasyon notu</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-300">
          Ödeme ekranı şu anda yalnızca dışarıda gerçekleşen tahsilatları manuel kaydeder; otomatik ödeme alma, abonelik yenileme ve e-fatura entegrasyonu bu sürümde etkin değildir.
        </p>
      </section>
    </div>
  );
}
