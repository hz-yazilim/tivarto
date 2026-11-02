import { getTenantContext } from "@/lib/session.server";
import { listOrders, updateOrderStatusAction } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "NEW", label: "Yeni" },
  { value: "CONFIRMED", label: "Onaylandı" },
  { value: "PREPARING", label: "Hazırlanıyor" },
  { value: "COMPLETED", label: "Tamamlandı" },
  { value: "CANCELLED", label: "İptal" },
];

const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((o: any) => [o.value, o.label])
);

export default async function OrdersPage() {
  const { tenant } = await getTenantContext();

  const orders = await listOrders(tenant.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sipariş Yönetimi</h1>
          <p className="text-muted-foreground text-sm">
            İnternet sitenizden gelen siparişleri yönetin ve stoklarını güncelleyin.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Siparişler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {orders.length > 0 ? (
              orders.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <div className="font-medium">
                      Sipariş #{o.id.slice(-6)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {o.customerName} · {o.customerPhone}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(o.createdAt).toLocaleString("tr-TR")}
                    </div>
                    <div className="mt-2 text-sm">
                      {o.items
                        .map((it: any) => `${it.name} ×${it.quantity}`)
                        .join(", ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColor(o.status)}`}>
                      {STATUS_LABEL[o.status]}
                    </span>
                    <form action={updateOrderStatusAction} className="inline" onSubmit={(e) => {
                      if (!confirm("Sipariş durumu değiştirilsin mi?")) e.preventDefault();
                    }}>
                      <input type="hidden" name="id" value={o.id} />
                      <select
                        name="status"
                        className="border rounded px-2 py-1 text-xs bg-background"
                        defaultValue={o.status}
                      >
                        {STATUS_OPTIONS.map((o: any) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" size="sm">Kaydet</Button>
                    </form>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground p-4">Henüz sipariş yok.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        Toplam: <span className="font-medium">{orders.length}</span> sipariş · Kasa:
        <span className="font-medium">
          {orders.reduce((sum: number, o: any) => sum + Number(o.total), 0).toLocaleString("tr-TR")}
        </span>
        TL
      </div>
    </div>
  );
}

function statusColor(s: string) {
  const map: Record<string, string> = {
    NEW: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    PREPARING: "bg-orange-100 text-orange-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return map[s] || "bg-muted text-muted-foreground";
}
