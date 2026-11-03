"use server";

import Link from "next/link";
import { requireTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";

export const dynamic = "force-dynamic";

const money = (value: number) => value.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });

export default async function ReportsPage() {
  const { tenant } = await requireTenantContext();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const data = await withTenant(tenant.id, async (tx) => {
    const [orders, products] = await Promise.all([
      tx.order.findMany({
        where: { createdAt: { gte: since }, status: { not: "CANCELLED" } },
        orderBy: { createdAt: "desc" },
        include: { items: { include: { product: { select: { buyPrice: true } } } } },
      }),
      tx.product.findMany({
        where: { isActive: true },
        orderBy: { stock: "asc" },
        select: { id: true, name: true, stock: true, minStock: true, buyPrice: true, sellPrice: true },
      }),
    ]);
    return { orders, products };
  });

  const revenue = data.orders.reduce((sum, order) => sum + Number(order.total), 0);
  const grossProfit = data.orders.reduce((sum, order) => sum + order.items.reduce((lineSum, item) => {
    const cost = Number(item.product.buyPrice ?? 0);
    return lineSum + (Number(item.unitPrice) - cost) * item.quantity;
  }, 0), 0);
  const stockValue = data.products.reduce((sum, product) => sum + Number(product.buyPrice ?? 0) * product.stock, 0);
  const lowStock = data.products.filter((product) => product.stock <= product.minStock);
  const topProducts = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const order of data.orders) for (const item of order.items) {
    const current = topProducts.get(item.productId) ?? { name: item.name, quantity: 0, revenue: 0 };
    current.quantity += item.quantity;
    current.revenue += Number(item.unitPrice) * item.quantity;
    topProducts.set(item.productId, current);
  }
  const bestsellers = [...topProducts.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));
    return { date: day, label: day.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }), total: 0, count: 0 };
  });
  for (const order of data.orders) {
    const key = new Date(order.createdAt);
    key.setHours(0, 0, 0, 0);
    const day = days.find((item) => item.date.getTime() === key.getTime());
    if (day) { day.total += Number(order.total); day.count += 1; }
  }
  const maxDaily = Math.max(1, ...days.map((day) => day.total));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Satış ve Stok Raporları</h1>
          <p className="mt-1 text-sm text-muted-foreground">Son 30 günün gerçek siparişleri ve mevcut ürün maliyetleri üzerinden hesaplanır.</p>
        </div>
        <Link href="/api/reports/export" className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent">30 günlük siparişleri CSV indir</Link>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "30 günlük satış", value: money(revenue) },
          { label: "Tamamlanmamış/aktif sipariş dahil", value: String(data.orders.length) },
          { label: "Tahmini brüt kâr", value: money(grossProfit) },
          { label: "Mevcut stok maliyeti", value: money(stockValue) },
        ].map((item) => <article key={item.label} className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{item.label}</p><p className="mt-2 text-xl font-bold">{item.value}</p></article>)}
      </section>
      <p className="text-xs text-muted-foreground">Brüt kâr, ürün kartındaki alış fiyatı ile sipariş satırındaki satış fiyatından tahmin edilir; vergi, kargo, komisyon, fire ve diğer giderleri içermez.</p>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold">Son 7 gün satış trendi</h2>
          <div className="mt-4 space-y-3">
            {days.map((day) => <div key={day.label} className="grid grid-cols-[56px_1fr_100px] items-center gap-3 text-sm"><span className="text-muted-foreground">{day.label}</span><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: (day.total / maxDaily * 100) + "%" }} /></div><span className="text-right font-medium">{money(day.total)}</span></div>)}
          </div>
        </article>
        <article className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold">En çok satılan ürünler</h2>
          <div className="mt-4 space-y-3">
            {bestsellers.length ? bestsellers.map((item) => <div key={item.name} className="flex items-center justify-between gap-3 border-b border-border pb-2 text-sm last:border-0"><span className="truncate">{item.name}</span><span className="shrink-0 font-semibold">{item.quantity} adet · {money(item.revenue)}</span></div>) : <p className="text-sm text-muted-foreground">Bu dönemde satış kaydı bulunmuyor.</p>}
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-semibold">Yeniden sipariş önerileri</h2><p className="mt-1 text-xs text-muted-foreground">Stok miktarı minimum seviyeye eşit veya altında olan ürünler.</p></div><Link href="/panel/stock" className="text-sm text-primary hover:underline">Stok yönetimine git</Link></div>
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[440px] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="py-2">Ürün</th><th className="py-2 text-right">Mevcut</th><th className="py-2 text-right">Minimum</th><th className="py-2 text-right">Önerilen alım</th></tr></thead><tbody>{lowStock.length ? lowStock.map((product) => <tr key={product.id} className="border-b border-border last:border-0"><td className="py-3 font-medium">{product.name}</td><td className="py-3 text-right text-red-400">{product.stock}</td><td className="py-3 text-right">{product.minStock}</td><td className="py-3 text-right font-semibold">{Math.max(0, product.minStock * 2 - product.stock)}</td></tr>) : <tr><td colSpan={4} className="py-5 text-center text-muted-foreground">Kritik stokta ürün bulunmuyor.</td></tr>}</tbody></table></div>
      </section>
    </div>
  );
}
