import { getTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";
import { listGoodsReceipts } from "@/actions/receipts";
import ReceiptForm from "@/components/receipt-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Beklemede",
  RECEIVED: "Tam Alındı",
  PARTIAL: "Kısmi Alındı",
  CANCELLED: "İptal",
};

export default async function ReceiptsPage() {
  const { tenant } = await getTenantContext();

  // DİKKAT: listGoodsReceipts kendi transaction'ını açtığı için
  // başka bir withTenant bloğunun İÇİNDE çağrılmamalıdır.
  const [products, suppliers, receipts] = await Promise.all([
    withTenant(tenant.id, (tx) =>
      tx.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
    ),
    withTenant(tenant.id, (tx) =>
      tx.supplier.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
    ),
    listGoodsReceipts(tenant.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mal Kabul Yönetimi</h1>
        <p className="text-sm text-muted-foreground">
          Tedarikçiden gelen ürünleri kaydedin; sağlam teslim alınan miktar stoğa
          eklenir.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yeni Mal Kabul Kaydı</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <ReceiptForm products={products} suppliers={suppliers} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mal Kabul Geçmişi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {receipts.length > 0 ? (
              receipts.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 p-4 md:flex-row md:items-center"
                >
                  <div className="flex-1">
                    <div className="font-medium">Mal Kabul #{r.id.slice(-6)}</div>
                    <div className="text-sm text-muted-foreground">
                      {r.supplier?.name ?? "Tedarikçi seçilmedi"} ·{" "}
                      {new Date(r.createdAt).toLocaleString("tr-TR")}
                    </div>
                    {r.note && (
                      <p className="mt-1 text-sm text-muted-foreground">{r.note}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${statusBadgeColor(
                        r.status
                      )}`}
                    >
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                    <div className="text-right text-sm font-medium">
                      {r.items.reduce((sum, it) => sum + Math.max(0, it.receivedQuantity - it.damagedQuantity), 0)} sağlam adet
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-8 text-center text-muted-foreground">
                Henüz mal kabul kaydı yok.
              </p>
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
  return map[s] ?? "bg-muted text-muted-foreground";
}
