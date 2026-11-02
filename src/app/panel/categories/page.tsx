import { getTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";
import { createCategoryAction, deleteCategoryAction } from "@/actions/catalog";
import { SubmitButton } from "@/components/ui/submit-button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const { tenant } = await getTenantContext();

  const categories = await withTenant(tenant.id, async (tx) => {
    return tx.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } },
    });
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kategoriler</h1>
        <p className="text-sm text-muted-foreground">
          Ürün kategorilerinizi oluşturun ve düzenleyin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yeni Kategori Ekle</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <form
            action={createCategoryAction}
            className="grid items-end gap-3 md:grid-cols-4"
          >
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="name">Kategori Adı</Label>
              <Input id="name" name="name" placeholder="Örn. Gıda" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sortOrder">Sıra No</Label>
              <Input id="sortOrder" name="sortOrder" type="number" defaultValue="0" />
            </div>
            <SubmitButton>Ekle</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kategori Listesi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {categories.length > 0 ? (
              categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c._count.products} ürün · sıra {c.sortOrder}
                    </div>
                  </div>
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <ConfirmSubmitButton
                      variant="destructive"
                      size="sm"
                      message="Bu kategoriyi silmek istediğinize emin misiniz? Kategoriye bağlı ürünler kategorisiz kalır."
                    >
                      Sil
                    </ConfirmSubmitButton>
                  </form>
                </div>
              ))
            ) : (
              <p className="p-4 text-center text-muted-foreground">
                Henüz kategori yok.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
