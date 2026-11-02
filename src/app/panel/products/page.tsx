import { getTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";
import ProductForm, {
  ProductDeleteForm,
  ProductToggle,
} from "@/components/product-form";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export const dynamic = "force-dynamic";

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

    const editing = edit
      ? await tx.product.findFirst({ where: { id: edit, tenantId: tenant.id } })
      : null;

    return { products, categories, editing };
  });

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

      <Card>
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
    </div>
  );
}
