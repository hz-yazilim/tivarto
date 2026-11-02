import { getTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";
import { createStockMovementAction, adjustStockAction } from "@/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MOVEMENT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "IN", label: "Stok Girişi" },
  { value: "OUT", label: "Stok Çıkışı" },
  { value: "ADJUST", label: "Manuel Düzelme" },
];

export default async function StockPage() {
  const { tenant } = await getTenantContext();

  const data = await withTenant(tenant.id, async (tx) => {
    const products = await tx.product.findMany({
      orderBy: { name: "asc" },
      include: { category: true },
    });
    const movements = await tx.stockMovement.findMany({
      take: 30,
      orderBy: { createdAt: "desc" },
      include: { product: true },
    });
    return { products, movements };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Stok Yönetimi</h1>
          <p className="text-muted-foreground text-sm">
            Stok giriş-çıkış kayıtlarını tutun ve stok sayımı yapın.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Stok Girişi / Çıkışı</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <form action={createStockMovementAction} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="productId">Ürün</Label>
                <select id="productId" name="productId" required className="w-full border rounded px-2 py-2">
                  <option value="">Seçiniz</option>
                  {data.products.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.stock} adet)
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="type">İşlem Türü</Label>
                <select id="type" name="type" className="w-full border rounded px-2 py-2">
                  {MOVEMENT_OPTIONS.map((o: any) => (
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
                <Input id="note" name="note" placeholder="Örn. Yeni malteslim" />
              </div>
              <Button type="submit">Kaydet</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stok Sayımı (Düzeltme)</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <form action={adjustStockAction} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="productId2">Ürün</Label>
                <select id="productId2" name="productId" required className="w-full border rounded px-2 py-2">
                  <option value="">Seçiniz</option>
                  {data.products.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
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
              <Button type="submit">Stok Güncelle</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kritik Stok Uyarısı</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <p className="text-sm text-muted-foreground mb-3">
              Aşağıdaki ürünler kritik stok seviyesinde veya altında:
            </p>
            <ul className="space-y-2 text-sm">
              {data.products
                .filter((p: any) => p.isActive && p.stock <= p.minStock)
                .slice(0, 8)
                .map((p: any) => (
                  <li key={p.id} className="flex items-center justify-between">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-red-600 font-bold">
                      {p.stock} / {p.minStock}
                    </span>
                  </li>
                ))}
              {data.products.filter((p: any) => p.isActive && p.stock <= p.minStock).length === 0 && (
                <li className="text-muted-foreground">Kritik stokta ürün yok.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Son Stok Hareketleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {data.movements.length > 0 ? (
              data.movements.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-3">
                  <div>
                    <div className="font-medium">{m.product?.name || "-"}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(m.createdAt).toLocaleString("tr-TR")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${m.type === "IN" ? "text-green-700" : m.type === "OUT" ? "text-red-700" : "text-muted-foreground"}`}>
                      {m.type === "IN" ? "+" : m.type === "OUT" ? "-" : "~"}{m.quantity}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {m.type === "IN" ? "Giriş" : m.type === "OUT" ? "Çıkış" : "Düzelme"}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground p-4">Henüz hareket yok.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
