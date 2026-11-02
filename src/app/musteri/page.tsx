import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import DemoBanner from "@/components/demo-banner";
import DemoRoleSwitcher from "@/components/demo-role-switcher";
import { DEMO_ACTIVE } from "@/lib/demo-config";
import {
  DEMO_CUSTOMER_PHONE,
  DEMO_SHOP_SLUG,
  DEMO_TENANT_ID,
} from "@/lib/constants";
import { withTenant } from "@/lib/db";
import { getSession } from "@/lib/session.server";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  NEW: "Yeni · Alındı",
  CONFIRMED: "Onaylandı",
  PREPARING: "Hazırlanıyor",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal edildi",
};

const STATUS_CLASS: Record<string, string> = {
  NEW: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-orange-100 text-orange-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

/**
 * Normal müşterinin kullanacağı panel (demo sürümü).
 * Veritabanı bağlanıp gerçek müşteri hesapları eklenene kadar örnek müşterinin
 * siparişlerini gösterir; müşteri girişi demo oturumu ile yapılır.
 */
export default async function CustomerPanelPage() {
  // Bu panel yalnızca demo katmanı aktifken var olur.
  if (!DEMO_ACTIVE) notFound();

  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/musteri");

  const orders = await withTenant(DEMO_TENANT_ID, (tx) =>
    tx.order.findMany({
      where: { customerPhone: DEMO_CUSTOMER_PHONE },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
  );

  const activeOrders = orders.filter((o) => o.status !== "CANCELLED");
  const totalSpent = activeOrders.reduce(
    (sum, o) => sum + Number(o.total ?? 0),
    0
  );

  return (
    <div className="min-h-screen bg-secondary">
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
        <nav className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-sm font-semibold">
            ← Tivarto
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href={`/shop/${DEMO_SHOP_SLUG}`} className="font-medium text-primary hover:underline">
              Vitrine git
            </Link>
            <a href="/logout" className="text-muted-foreground hover:underline">
              Çıkış yap
            </a>
          </div>
        </nav>

        <div className="mb-5">
          <DemoRoleSwitcher compact />
        </div>

        <DemoBanner />

        <header className="mb-6">
          <h1 className="text-2xl font-bold">Merhaba, {session.user.name ?? session.user.email}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Müşteri paneli · Siparişlerinizin durumunu buradan takip edebilirsiniz.
          </p>
        </header>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Toplam Sipariş" value={String(orders.length)} />
          <Stat
            label="Devam Eden"
            value={String(
              orders.filter((o) =>
                ["NEW", "CONFIRMED", "PREPARING"].includes(o.status)
              ).length
            )}
          />
          <Stat
            label="Toplam Tutar"
            value={`${totalSpent.toLocaleString("tr-TR")} TL`}
          />
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Siparişlerim</h2>
          </div>
          <div className="divide-y divide-border">
            {orders.length > 0 ? (
              orders.map((order) => (
                <div key={order.id} className="flex flex-col gap-3 p-5 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">Sipariş #{order.id.slice(-6)}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[order.status] ?? "bg-muted text-muted-foreground"}`}>
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString("tr-TR")} · {order.customerPhone}
                    </div>
                    <div className="mt-2 text-sm">
                      {order.items
                        .map((item) => `${item.name} ×${item.quantity}`)
                        .join(", ") || "-"}
                    </div>
                    {order.note && (
                      <div className="mt-1 text-xs text-muted-foreground">Not: {order.note}</div>
                    )}
                  </div>
                  <div className="shrink-0 font-semibold">
                    {Number(order.total).toLocaleString("tr-TR")} TL
                  </div>
                </div>
              ))
            ) : (
              <p className="p-8 text-center text-muted-foreground">
                Henüz siparişiniz yok. Vitrinden ilk siparişinizi verebilirsiniz.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-5 text-sm">
          <h2 className="font-semibold">Yeni sipariş vermek ister misiniz?</h2>
          <p className="mt-1 text-muted-foreground">
            Ürünleri inceleyip sepetinizi oluşturun; siparişiniz işletme panelinde
            anında görünür.
          </p>
          <Link
            href={`/shop/${DEMO_SHOP_SLUG}`}
            className="mt-3 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Vitrinde alışveriş yap →
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
