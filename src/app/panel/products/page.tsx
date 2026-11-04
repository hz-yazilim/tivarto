import { getTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";
import ProductForm, {
  ProductDeleteForm,
  ProductToggle,
} from "@/components/product-form";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import ProductImportForm from "@/components/product-import-form";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; imported?: string; importError?: string; q?: string; category?: string; status?: string; page?: string }>;
}) {
  const { tenant } = await getTenantContext();
  const { edit, imported, importError, q = "", category = "", status = "all", page: pageValue } = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(pageValue ?? "1", 10) || 1);
  const pageSize = 20;
  const where = {
    ...(q.trim() ? {
      OR: [
        { name: { contains: q.trim(), mode: "insensitive" as const } },
        { sku: { contains: q.trim(), mode: "insensitive" as const } },
        { barcode: { contains: q.trim(), mode: "insensitive" as const } },
      ],
    } : {}),
    ...(category ? { categoryId: category } : {}),
    ...(status === "active" ? { isActive: true } : status === "inactive" ? { isActive: false } : {}),
  };

  const data = await withTenant(tenant.id, async (tx) => {
    const [products, categories, total, editing] = await Promise.all([
      tx.product.findMany({
        where,
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        include: { category: true },
      }),
      tx.category.findMany({ orderBy: { sortOrder: "asc" } }),
      tx.product.count({ where }),
      edit ? tx.product.findFirst({ where: { id: edit, tenantId: tenant.id } }) : null,
    ]);

    return { products, categories, total, editing };
  });
  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));
  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (status !== "all") params.set("status", status);
    params.set("page", String(page));
    return "/panel/products?" + params.toString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ürün Yönetimi</h1>
          <p className="text-sm text-muted-foreground">
            Ürünlerinizi ekleyin, düzenleyin ve stoklarını takip edin.
          </p>
        </div>
        <Link
          href="/panel/products"
          className="text-sm text-muted-foreground hover:underline"
        >
          Yenile
        </Link>
      </div>

      {imported ? <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700">{imported} ürün başarıyla aktarıldı. Açılış stok hareketleri de kaydedildi.</p> : null}
      {importError ? <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700">{importError}</p> : null}

      <ProductImportForm />

      <form method="get" action="/panel/products" className="rounded-2xl border border-border bg-card p-3 sm:p-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_190px_150px_auto_auto]">
          <input name="q" defaultValue={q} placeholder="Ürün adı, SKU veya barkod ara" aria-label="Ürün ara" className="h-10 min-w-0 rounded-lg border border-input bg-background px-3 text-sm" />
          <select name="category" defaultValue={category} aria-label="Kategoriye göre filtrele" className="h-10 min-w-0 rounded-lg border border-input bg-background px-3 text-sm">
            <option value="">Tüm kategoriler</option>
            {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select name="status" defaultValue={status} aria-label="Ürün durumuna göre filtrele" className="h-10 min-w-0 rounded-lg border border-input bg-background px-3 text-sm">
            <option value="all">Tüm durumlar</option>
            <option value="active">Yayındaki ürünler</option>
            <option value="inactive">Pasif ürünler</option>
          </select>
          <button type="submit" className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">Filtrele</button>
          <Link href="/panel/products" className="inline-flex h-10 items-center justify-center rounded-lg border border-input px-4 text-sm font-medium hover:bg-accent">Temizle</Link>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">{data.total} ürün bulundu · Sayfa {currentPage}/{totalPages}</div>
      </form>

      <Card>
        <CardContent className="p-0">
          <ProductForm
            categories={data.categories.map((c) => ({ id: c.id, name: c.name }))}
            mode={data.editing ? "edit" : "add"}
            initial={
              data.editing
                ? {
                    id: data.editing.id,
                    name: data.editing.name,
                    categoryId: data.editing.categoryId,
                    sku: data.editing.sku,
                    barcode: data.editing.barcode,
                    description: data.editing.description,
                    imageUrl: data.editing.imageUrl,
                    buyPrice: data.editing.buyPrice?.toString() ?? "",
                    sellPrice: data.editing.sellPrice.toString(),
                    stock: data.editing.stock,
                    minStock: data.editing.minStock,
                    isActive: data.editing.isActive,
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>

      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="p-3 font-medium">Ürün</th>
                  <th className="p-3 font-medium">Kategori</th>
                  <th className="p-3 font-medium">Barkod</th>
                  <th className="p-3 text-right font-medium">Satış</th>
                  <th className="p-3 text-right font-medium">Stok</th>
                  <th className="p-3 text-center font-medium">Durum</th>
                  <th className="p-3 text-right font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.products.length > 0 ? (
                  data.products.map((p) => (
                    <tr key={p.id}>
                      <td className="p-3">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.sku ?? "-"}
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {p.category?.name ?? "-"}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {p.barcode ?? "-"}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {Number(p.sellPrice).toLocaleString("tr-TR")} TL
                      </td>
                      <td
                        className={`p-3 text-right ${
                          p.stock <= p.minStock ? "font-semibold text-red-600" : ""
                        }`}
                      >
                        {p.stock}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                            p.isActive
                              ? "border-green-200 bg-green-100 text-green-800"
                              : "border-red-200 bg-red-100 text-red-800"
                          }`}
                        >
                          {p.isActive ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/panel/products?edit=${p.id}`}
                            className="text-sm text-primary hover:underline"
                          >
                            Düzenle
                          </Link>
                          <ProductToggle id={p.id} isActive={p.isActive} />
                          <ProductDeleteForm id={p.id} />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Henüz ürün eklenmemiş. Yukarıdaki formdan ilk ürününüzü
                      ekleyebilirsiniz.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:hidden">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold">Ürün listesi</h2>
          <span className="text-xs text-muted-foreground">{data.total} ürün</span>
        </div>
        {data.products.length > 0 ? data.products.map((p) => (
          <article key={p.id} className="rounded-2xl border border-border bg-card p-3 shadow-sm">
            <div className="flex min-w-0 items-start gap-3">
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl border border-border object-cover" />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted text-xl">📦</div>
              )}
              <div className="min-w-0 flex-1">
                <div className="break-words text-sm font-semibold">{p.name}</div>
                <div className="mt-1 truncate text-xs text-muted-foreground">{p.category?.name ?? "Kategorisiz"} · SKU: {p.sku ?? "—"}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={"rounded-full border px-2 py-0.5 text-[10px] font-semibold " + (p.isActive ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" : "border-rose-400/25 bg-rose-400/10 text-rose-300")}>{p.isActive ? "Yayında" : "Pasif"}</span>
                  {p.stock <= p.minStock && <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-300">Kritik stok</span>}
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-3">
              <div><div className="text-[10px] text-muted-foreground">Satış fiyatı</div><div className="mt-0.5 text-sm font-bold tabular-nums">{Number(p.sellPrice).toLocaleString("tr-TR")} TL</div></div>
              <div><div className="text-[10px] text-muted-foreground">Stok miktarı</div><div className={"mt-0.5 text-sm font-bold tabular-nums " + (p.stock <= p.minStock ? "text-rose-300" : "")}>{p.stock} <span className="text-xs font-normal text-muted-foreground">adet</span></div></div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link href={"/panel/products?edit=" + p.id} className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground">Düzenle</Link>
              <ProductToggle id={p.id} isActive={p.isActive} />
              <ProductDeleteForm id={p.id} />
            </div>
          </article>
        )) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Henüz ürün eklenmemiş. Yukarıdaki formdan ilk ürününüzü ekleyebilirsiniz.</div>
        )}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Ürün sayfaları" className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
          <Link aria-disabled={currentPage <= 1} tabIndex={currentPage <= 1 ? -1 : 0} href={pageHref(Math.max(1, currentPage - 1))} className={"rounded-lg border border-input px-3 py-2 text-xs font-medium " + (currentPage <= 1 ? "pointer-events-none opacity-40" : "hover:bg-accent")}>← Önceki</Link>
          <span className="text-xs text-muted-foreground">{currentPage} / {totalPages}</span>
          <Link aria-disabled={currentPage >= totalPages} tabIndex={currentPage >= totalPages ? -1 : 0} href={pageHref(Math.min(totalPages, currentPage + 1))} className={"rounded-lg border border-input px-3 py-2 text-xs font-medium " + (currentPage >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-accent")}>Sonraki →</Link>
        </nav>
      )}
    </div>
  );
}
