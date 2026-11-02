import { listTenants, updateTenantStatus, updateTenantPlan } from "@/actions/admin";
import { listPlans } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Aktif",
  SUSPENDED: "Askıya Alınmış",
};

export default async function TenantsPage() {
  const [tenants, plans] = await Promise.all([listTenants(), listPlans()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">İşletme Yönetimi</h1>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <table className="w-full text-sm divide-y divide-border">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="p-4">İşletme</th>
              <th className="p-4">Plan</th>
              <th className="p-4">Durum</th>
              <th className="p-4">Ürün</th>
              <th className="p-4">Sipariş</th>
              <th className="p-4 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {tenants.length > 0 ? (
              tenants.map((t: any) => (
                <tr key={t.id} className="p-4">
                  <td>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.slug}</div>
                  </td>
                  <td>
                    <form action={updateTenantPlan} className="inline">
                      <input type="hidden" name="id" value={t.id} />
                      <select
                        name="planId"
                        defaultValue={t.planId}
                        className="border rounded px-2 py-1 text-xs bg-background"
                      >
                        {plans.map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.priceMonthly} TL)
                          </option>
                        ))}
                      </select>
                      <Button type="submit" size="sm" className="ml-2">
                        Ata
                      </Button>
                    </form>
                  </td>
                  <td>
                    <form action={updateTenantStatus} className="inline">
                      <input type="hidden" name="id" value={t.id} />
                      <select
                        name="status"
                        defaultValue={t.status}
                        className="border rounded px-2 py-1 text-xs bg-background"
                      >
                        <option value="ACTIVE">Aktif</option>
                        <option value="SUSPENDED">Askıya Al</option>
                      </select>
                      <Button type="submit" size="sm" className="ml-2">
                        Kaydet
                      </Button>
                    </form>
                  </td>
                  <td className="text-muted-foreground">{t._count.products}</td>
                  <td className="text-muted-foreground">{t._count.orders}</td>
                  <td className="text-right">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      t.status === "ACTIVE"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-red-100 text-red-800 border-red-200"
                    }`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">İşletme yok.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
