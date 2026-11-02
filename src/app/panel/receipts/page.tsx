import { getTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";
import { listGoodsReceipts } from "@/actions/receipts";
import ReceiptForm from "@/components/receipt-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Beklemede",
  RECEIVED: "Tam Alındı",
  PARTIAL: "Kısmi Alındı",
  CANCELLED: "İptal",
};

export default async function ReceiptsPage() {
  const { tenant } = await getTenantContext();

  const data = await withTenant(tenant.id, async (tx) => {
    const [products, suppliers, receipts] = await Promise.all([
      tx.product.findMany({ orderBy: { name: "asc" } }),
      tx.supplier.findMany({ orderBy: { name: "asc" } }),
      listGoodsReceipts(tenant.id),
    ]);
    return { products, suppliers, receipts };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mal Kabul Yönetimi</h1>
          <p className="text-muted-foreground text-sm">
            Tedarikçiden gelen ürünleri kaydedin ve stoğa ekleyin.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yeni Mal Kabul Kaydı</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <ReceiptForm products={data.products} suppliers={data.suppliers} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mal Kabul Geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {data.receipts.length > 0 ? (
              data.receipts.map((r: any) => (
                <div key={r.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="font-medium">
                      Mal Kabul #{r.id.slice(-6)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {r.supplier?.name || "Tedarikçi seçilmedi"} ·
                      {new Date(r.createdAt).toLocaleString("tr-TR")}
                    </div>
                    {r.note && (
                      <p className="text-sm text-muted-foreground mt-1">{r.note}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusBadgeColor(r.status)}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                    <div className="text-right text-sm font-medium">
                      {r.items.reduce((sum: number, it: any) => sum + it.receivedQuantity, 0)} adet
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground p-4">Henüz mal kabul kaydı yok.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function statusBadgeColor(s: string) {
  const map: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    RECEIVED: "bg-green-100 text-green-800",
    PARTIAL: "bg-orange-100 text-orange-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return map[s] || "bg-muted text-muted-foreground";
}
