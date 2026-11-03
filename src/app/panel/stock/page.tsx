import { getTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";
import { createStockMovementAction, adjustStockAction } from "@/actions/inventory";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const MOVEMENT_OPTIONS = [
  { value: "IN", label: "Stok Girişi" },
  { value: "OUT", label: "Stok Çıkışı" },
];

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { tenant } = await getTenantContext();
  const { error } = await searchParams;

  const data = await withTenant(tenant.id, async (tx) => {
    const [products, movements] = await Promise.all([
      tx.product.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          stock: true,
          minStock: true,
          isActive: true,
        },
      }),
      tx.stockMovement.findMany({
        take: 30,
        orderBy: { createdAt: "desc" },
        include: { product: { select: { name: true } } },
      }),
    ]);
    return { products, movements };
  });

  const critical = data.products.filter((p) => p.isActive && p.stock <= p.minStock);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Stok Yönetimi</h1>
        <p className="text-sm text-muted-foreground">
          Stok giriş-çıkış kayıtlarını tutun ve sayım sonucu düzeltme yapın.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-red-300/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {data.products.length === 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Önce ürün eklemelisiniz. Stok işlemleri için{" "}
          <a href="/panel/products" className="font-medium underline">
            Ürünler
          </a>{" "}
          sayfasını kullanın.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stok Girişi / Çıkışı</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <form action={createStockMovementAction} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="productId">Ürün</Label>
                <select
                  id="productId"
                  name="productId"
                  required
                  className={selectClass}
                  disabled={data.products.length === 0}
                >
                  <option value="">Seçiniz</option>
                  {data.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.stock} adet)
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="type">İşlem Türü</Label>
                <select id="type" name="type" className={selectClass}>
                  {MOVEMENT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="quantity">Miktar</Label>
                <Input id="quantity" name="quantity" type="number" min="1" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="note">Açıklama</Label>
                <Input id="note" name="note" placeholder="Örn. Perakende satış" />
              </div>
              <SubmitButton disabled={data.products.length === 0}>
                Kaydet
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stok Sayımı (Düzeltme)</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <form action={adjustStockAction} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="productId2">Ürün</Label>
                <select
                  id="productId2"
                  name="productId"
                  required
                  className={selectClass}
                  disabled={data.products.length === 0}
                >
                  <option value="">Seçiniz</option>
                  {data.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.stock} adet)
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="newStock">Yeni Stok Miktarı (adet)</Label>
                <Input id="newStock" name="newStock" type="number" min="0" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="note2">Açıklama</Label>
                <Input id="note2" name="note" placeholder="Stok sayımı sonucu" />
              </div>
              <SubmitButton disabled={data.products.length === 0}>
                Stok Güncelle
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kritik Stok Uyarısı</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <p className="mb-3 text-sm text-muted-foreground">
              Kritik seviyede veya altında olan aktif ürünler:
            </p>
            <ul className="space-y-2 text-sm">
              {critical.length > 0 ? (
                critical.slice(0, 8).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="font-bold text-red-600">
                      {p.stock} / {p.minStock}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground">Kritik stokta ürün yok.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Son Stok Hareketleri</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {data.movements.length > 0 ? (
              data.movements.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {m.product?.name ?? "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(m.createdAt).toLocaleString("tr-TR")}
                      {m.note ? ` · ${m.note}` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-medium ${
                        m.type === "IN"
                          ? "text-green-700"
                          : m.type === "OUT"
                            ? "text-red-700"
                            : "text-muted-foreground"
                      }`}
                    >
                      {m.type === "IN" ? "+" : m.type === "OUT" ? "-" : "~"}
                      {m.quantity}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {m.type === "IN" ? "Giriş" : m.type === "OUT" ? "Çıkış" : "Düzeltme"}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-8 text-center text-muted-foreground">
                Henüz hareket yok.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
