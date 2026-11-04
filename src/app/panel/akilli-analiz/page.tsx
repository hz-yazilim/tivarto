import Link from 'next/link';
import { getBusinessInsights } from '@/actions/insights';

export const dynamic = 'force-dynamic';

const money = (value: number) =>
  value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });

const dateLabel = (value: Date | string) =>
  new Date(value).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </article>
  );
}

export default async function SmartAnalysisPage() {
  const data = await getBusinessInsights();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <span aria-hidden="true">✦</span> TİVARTO İŞ ZEKÂSI
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Akıllı İşletme Analizi</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Satış ve stok hareketlerinden üretilen öneriler. Tahminler mevcut kayıtlarına dayanır; otomatik sipariş veya müşteri mesajı gönderilmez.
          </p>
        </div>
        <Link href="/panel/reports" className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent">
          Detaylı raporlar
        </Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="İşletme özeti">
        <Metric
          label="Son 30 gün satış"
          value={money(data.revenue30)}
          detail={data.revenueChangePercent === null
            ? 'Karşılaştırma için önceki dönem verisi yok'
            : (data.revenueChangePercent >= 0 ? '+' : '') + data.revenueChangePercent.toFixed(1) + '% önceki 30 güne göre'}
        />
        <Metric
          label="Son 30 gün sipariş"
          value={String(data.orderCount30)}
          detail="İptal edilen siparişler hariç"
        />
        <Metric
          label="Tahmini brüt kâr"
          value={money(data.estimatedGrossProfit)}
          detail="Ürün kartındaki güncel alış maliyetine göre"
        />
        <Metric
          label="Stokta bağlı sermaye"
          value={money(data.stockValue)}
          detail="Mevcut stok × ürün alış fiyatı"
        />
      </section>

      {data.historyLimited && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700">
          Son 60 gündeki siparişlerin ilk 2.000 kaydı analiz edildi. Çok yüksek sipariş hacminde bu rapor kısmi olabilir.
        </p>
      )}

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">Stok yenileme radarı</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Son 30 günlük satış hızına göre yaklaşık 21 günlük stok hedefi.</p>
            </div>
            <Link href="/panel/stock" className="text-xs font-semibold text-primary hover:underline">Stok yönetimi</Link>
          </div>
          <div className="mt-4 space-y-3">
            {data.reorderSuggestions.length ? data.reorderSuggestions.map((item) => (
              <div key={item.id} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category} · 30 günde {item.sales30} adet</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-700">
                    {item.coverageDays === null ? 'Minimum stok' : Math.max(0, Math.floor(item.coverageDays)) + ' gün stok'}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Mevcut: <strong className="text-foreground">{item.stock}</strong></span>
                  <span className="text-muted-foreground">Önerilen alım: <strong className="text-foreground">{item.suggestedQuantity} adet</strong></span>
                </div>
              </div>
            )) : (
              <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
                Şu an satış hızına veya minimum stok seviyesine göre acil yenileme önerisi yok.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">Atıl stok ve bağlı sermaye</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Son 30 günde satılmayan, en az 30 günlük ve stokta bulunan ürünler.</p>
            </div>
            <span className="text-sm font-bold">{money(data.deadStockValue)}</span>
          </div>
          <div className="mt-4 space-y-3">
            {data.deadStock.length ? data.deadStock.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0">
                <div className="min-w-0">
                  <Link href={'/panel/products?edit=' + encodeURIComponent(item.id)} className="truncate text-sm font-medium hover:text-primary hover:underline">{item.name}</Link>
                  <p className="text-xs text-muted-foreground">{item.stock} adet stokta</p>
                </div>
                <span className="shrink-0 text-sm font-semibold">{money(item.tiedCapital)}</span>
              </div>
            )) : (
              <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
                Atıl stok sinyali bulunamadı. Yeni ürünler 30 günlük değerlendirmeye dahil edilmez.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-semibold">Satış ivmesi yüksek ürünler</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Son 30 günün en çok satılan ürünleri; önceki 30 günle adet bazında karşılaştırılır.</p>
          <div className="mt-4 space-y-3">
            {data.topProducts.length ? data.topProducts.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.quantity} adet · {money(item.revenue)} satış</p>
                </div>
                <span className="shrink-0 text-xs font-semibold">
                  {item.changePercent === null ? 'Yeni satış' : (item.changePercent >= 0 ? '+' : '') + item.changePercent.toFixed(0) + '%'}
                </span>
              </div>
            )) : (
              <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">Karşılaştırma için henüz satış kaydı yok.</p>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">Yeniden kazanılabilecek müşteriler</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Son 60 günde en az iki sipariş verip 21 gündür sipariş oluşturmayan müşteriler.</p>
            </div>
            <Link href="/panel/customers" className="text-xs font-semibold text-primary hover:underline">Müşteriler</Link>
          </div>
          <div className="mt-4 space-y-3">
            {data.customersToReconnect.length ? data.customersToReconnect.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">{customer.orderCount} sipariş · Son sipariş {dateLabel(customer.lastOrderAt)}</p>
                </div>
                <span className="shrink-0 text-right text-xs font-semibold">{customer.daysSinceLastOrder} gündür yok</span>
              </div>
            )) : (
              <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
                Yeniden iletişim kurulması gereken müşteri sinyali bulunamadı.
              </p>
            )}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Müşteri iletişimi manuel yapılır. Pazarlama mesajı göndermeden önce ilgili iletişim iznini kontrol edin.</p>
        </article>
      </section>

      {!data.hasHistory && (
        <section className="rounded-2xl border border-dashed border-border p-6 text-center">
          <h2 className="font-semibold">Analiz için satış geçmişi gerekiyor</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            İlk siparişler geldikçe satış ivmesi, stok yenileme ve müşteri geri kazanım önerileri burada oluşacak. Ürün ve stok verilerin şimdiden stok değerini hesaplamak için kullanılabilir.
          </p>
          <Link href="/panel/orders" className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Siparişleri görüntüle
          </Link>
        </section>
      )}

      <p className="text-xs text-muted-foreground">
        Son güncelleme: {dateLabel(data.generatedAt)}. Bu ekran karar desteği sağlar; satış tahminleri garanti değildir. Kâr hesabı vergi, komisyon, kargo ve diğer işletme giderlerini kapsamaz.
      </p>
    </div>
  );
}
