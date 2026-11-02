import { getTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";
import ProductForm, {
  ProductDeleteForm,
  ProductToggle,
} from "@/components/product-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { tenant } = await getTenantContext();
  const { edit } = await searchParams;

  const data = await withTenant(tenant.id, async (tx) => {
    const [products, categories] = await Promise.all([
      tx.product.findMany({
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
        include: { category: true },
      }),
      tx.category.findMany({ orderBy: { sortOrder: "asc" } }),
    ]);
    let editing = null;
    if (edit) {
      editing = await tx.product.findFirst({
        where: { id: edit, tenantId: tenant.id },
      });
    }
    return { products, categories, editing };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ürün Yönetimi</h1>
          <p className="text-muted-foreground text-sm">
            Ürünlerinizi ekleyin, düzenleyin ve stoklarını takip edin.
          </p>
        </div>
        <a href="/panel/products" className="text-sm text-muted-foreground hover:underline">
          Yenile
        </a>
      </div>

      <Card>
        <CardContent className="p-0">
          <ProductForm
            categories={data.categories}
            mode={edit ? "edit" : "add"}
            initial={data.editing}
          />
        </CardContent>
      </Card>

      <div className="rounded-xl border bg-card">
        <div className="border-b bg-muted/50 p-4">
          <div className="grid gap-4 text-sm font-medium md:grid-cols-12">
            <div className="col-span-4">Ürün Adı</div>
            <div className="col-span-2 hidden md:table-cell">Kategori</div>
            <div className="col-span-2 hidden md:table-cell">SKU / Barkod</div>
            <div className="col-span-2 text-right">Satış Fiyatı</div>
            <div className="col-span-2 text-right">Stok</div>
            <div className="col-span-2 text-right">Durum</div>
            <div className="col-span-4 text-right">İşlemler</div>
          </div>
        </div>
        <div className="divide-y divide-border">
          {data.products.length > 0 ? (
            data.products.map((p: any) => (
              <div
                key={p.id}
                className="p-4 grid gap-4 items-center md:grid-cols-12"
              >
                <div className="col-span-4">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.sku || "-"}</div>
                </div>
                <div className="col-span-2 hidden md:table-cell text-sm text-muted-foreground">
                  {p.category?.name || "-"}
                </div>
                <div className="col-span-2 hidden md:table-cell text-sm text-muted-foreground">
                  {p.barcode || "-"}
                </div>
                <div className="col-span-2 text-right text-sm font-medium">
                  {p.sellPrice.toLocaleString("tr-TR")} TL
                </div>
                <div className="col-span-2 text-right text-sm">
                  {p.stock} {p.stock <= p.minStock ? "(⚠️)" : ""}
                </div>
                <div className="col-span-2 text-right">
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${p.isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"}`}>
                    {p.isActive ? "Aktif" : "Pasif"}
                  </span>
                </div>
                <div className="col-span-4 text-right flex items-center justify-end gap-2">
                  <a
                    href={`/panel/products?edit=${p.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    Düzenle
                  </a>
                  <ProductToggle id={p.id} isActive={p.isActive} />
                  <ProductDeleteForm id={p.id} />
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Henüz ürün eklenmemiş. Yukarıdaki formdan ilk ürününüzü ekleyebilirsiniz.
            </div>
          )}
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Kategoriler</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Kategorileri yönetmek için{" "}
            <a href="/panel/categories" className="text-primary hover:underline">
              Kategoriler sayfasına gidin
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
