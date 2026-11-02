import { getTenantContext } from "@/lib/session.server";
import { listOrders, updateOrderStatusAction } from "@/actions/orders";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "NEW", label: "Yeni" },
  { value: "CONFIRMED", label: "Onaylandı" },
  { value: "PREPARING", label: "Hazırlanıyor" },
  { value: "COMPLETED", label: "Tamamlandı" },
  { value: "CANCELLED", label: "İptal" },
];

const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label])
);

export default async function OrdersPage() {
  const { tenant } = await getTenantContext();
  const orders = await listOrders(tenant.id);

  const activeOrders = orders.filter((o) => o.status !== "CANCELLED");
  const revenue = activeOrders.reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sipariş Yönetimi</h1>
        <p className="text-sm text-muted-foreground">
          İnternet mağazanızdan gelen siparişleri yönetin. İptal edilen siparişlerin
          stoğu otomatik olarak geri eklenir.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Sipariş Sayısı</div>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Bekleyen</div>
            <div className="text-2xl font-bold">
              {orders.filter((o) => o.status === "NEW").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Toplam Tutar</div>
            <div className="text-2xl font-bold">
              {revenue.toLocaleString("tr-TR")} TL
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Siparişler</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {orders.length > 0 ? (
              orders.map((o) => (
                <div
                  key={o.id}
                  className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Sipariş #{o.id.slice(-6)}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(
                          o.status
                        )}`}
                      >
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {o.customerName} · {o.customerPhone}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString("tr-TR")}
                    </div>
                    <div className="mt-1 text-sm">
                      {o.items.map((it) => `${it.name} ×${it.quantity}`).join(", ") ||
                        "-"}
                    </div>
                    {o.note && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Not: {o.note}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 md:flex-col md:items-end">
                    <div className="font-semibold">
                      {Number(o.total).toLocaleString("tr-TR")} TL
                    </div>
                    <form action={updateOrderStatusAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={o.id} />
                      <select
                        name="status"
                        defaultValue={o.status}
                        className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <SubmitButton size="sm" variant="outline">
                        Güncelle
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-8 text-center text-muted-foreground">
                Henüz sipariş yok. Siparişler vitrin sayfanızdan gelir.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
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
  return map[s] ?? "bg-muted text-muted-foreground";
}
