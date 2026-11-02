import { getTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";
import { createCategoryAction, deleteCategoryAction } from "@/actions/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CategoriesPage() {
  const { tenant } = await getTenantContext();

  const data = await withTenant(tenant.id, async (tx) => {
    const categories = await tx.category.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return { categories };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kategoriler</h1>
          <p className="text-muted-foreground text-sm">
            Ürün kategorilerinizi oluşturun ve düzenleyin.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Yeni Kategori Ekle</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <form action={createCategoryAction} className="grid gap-3 md:grid-cols-4 items-end">
            <div className="space-y-1">
              <Label htmlFor="name">Kategori Adı</Label>
              <Input id="name" name="name" placeholder="Örn. Gıda" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sortOrder">Sıra No</Label>
              <Input id="sortOrder" name="sortOrder" type="number" defaultValue="0" />
            </div>
            <Button type="submit">Ekle</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kategori Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {data.categories.length > 0 ? (
              data.categories.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Kategori
                    </div>
                  </div>
                  <form action={deleteCategoryAction} className="inline" onSubmit={(e) => {
                    if (!confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) e.preventDefault();
                  }}>
                    <input type="hidden" name="id" value={c.id} />
                    <Button type="submit" variant="destructive" size="sm">
                      Sil
                    </Button>
                  </form>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground p-4">Henüz kategori yok.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
