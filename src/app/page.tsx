import Link from "next/link";
import { Button } from "@/components/ui/button";
import DemoRoleSwitcher from "@/components/demo-role-switcher";
import { DEMO_SHOP_SLUG } from "@/lib/constants";
import { DEMO_ACTIVE } from "@/lib/demo-config";

const FEATURES = [
  {
    title: "Ürün Yönetimi",
    desc: "Ürün ekleyin, kategorilere ayırın, fiyat ve görselleri güncelleyin.",
    icon: "📦",
  },
  {
    title: "Stok Takibi",
    desc: "Giriş-çıkış hareketleri, stok sayımı ve kritik stok uyarıları.",
    icon: "📊",
  },
  {
    title: "Dijital Vitrin",
    desc: "Ürünleriniz otomatik olarak herkese açık mağaza sayfanızda yayınlanır.",
    icon: "🛒",
  },
  {
    title: "Mal Kabul",
    desc: "Tedarikçiden gelen ürünleri eksik/hasarlı kaydıyla birlikte stoğa alın.",
    icon: "🚚",
  },
  {
    title: "Müşteri & Tedarikçi",
    desc: "Müşteri ve tedarikçi kartları, sipariş geçmişi.",
    icon: "👥",
  },
  {
    title: "Sipariş Yönetimi",
    desc: "Vitrinden gelen siparişleri durum takibiyle yönetin.",
    icon: "🧾",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 md:py-16">
      <header className="mb-14 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
          T
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Tiverto</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          İşletmeni yönet, ticaretini büyüt.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
          Tiverto; küçük ve orta ölçekli işletmelerin ürünlerini, stoklarını,
          müşterilerini, tedarikçilerini ve siparişlerini tek bir platform
          üzerinden yönetebilmesi için geliştirilen bulut tabanlı işletme yönetim
          platformudur.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register">
            <Button size="lg">Ücretsiz Başla</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Giriş Yap
            </Button>
          </Link>
        </div>
      </header>

      {DEMO_ACTIVE && (
        <section className="mb-12 rounded-xl border border-amber-200 bg-amber-50/60 p-5">
          <h2 className="text-lg font-semibold">Demo panellerine hızlı erişim</h2>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            Veritabanı bağlantısı henüz yapılmadığı için örnek verilerle
            çalışıyoruz. Aşağıdan bir rol seçerek üç panelden birine giriş
            yapabilirsiniz; bilgi girmeden de tek tıkla geçiş yapılır.
          </p>
          <div className="rounded-lg bg-card">
            <DemoRoleSwitcher />
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <Link href={`/shop/${DEMO_SHOP_SLUG}`} className="font-medium text-primary hover:underline">
              Müşteri vitrini: /shop/{DEMO_SHOP_SLUG} →
            </Link>
            <Link href="/musteri" className="font-medium text-primary hover:underline">
              Siparişlerim →
            </Link>
            <Link href="/panel" className="font-medium text-primary hover:underline">
              İşletme paneli →
            </Link>
            <Link href="/admin" className="font-medium text-primary hover:underline">
              Platform paneli →
            </Link>
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-border bg-card p-5 transition-colors hover:bg-accent/40"
          >
            <div className="mb-3 text-2xl">{f.icon}</div>
            <h2 className="mb-1 font-semibold">{f.title}</h2>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="mt-14 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        <h2 className="mb-2 font-semibold">Demo modu</h2>
        <ul className="list-inside list-disc space-y-1">
          <li>Bu sürüm geliştirme aşamasındadır, örnek verilerle çalışır.</li>
          <li>Giriş bilgileri doğrulanmaz; veriler bellekte tutulur, veritabanına yazılmaz.</li>
          <li>Demo verileri gerçek işletme verisi değildir.</li>
          <li>Gerçek müşteri bilgisi girilmemeli, gerçek ödeme alınmamalıdır.</li>
        </ul>
      </section>

      <footer className="mt-12 text-center text-xs text-muted-foreground">
        Tiverto — İşletmeni yönet, ticaretini büyüt.
      </footer>
    </main>
  );
}
