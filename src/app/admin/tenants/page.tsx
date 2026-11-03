import {
  listTenantUsage,
  listPlans,
  listTenants,
  updateTenantPlan,
  updateTenantStatus,
} from "@/actions/admin";
import { SubmitButton } from "@/components/ui/submit-button";

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Aktif",
  SUSPENDED: "Askıya Alınmış",
};

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const [tenants, plans, usage] = await Promise.all([
    listTenants(),
    listPlans(),
    listTenantUsage(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">İşletme Yönetimi</h1>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm divide-y divide-border">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="p-4">İşletme</th>
              <th className="p-4">Hesap Sahibi</th>
              <th className="p-4">Plan Ata</th>
              <th className="p-4">Durum Değiştir</th>
              <th className="p-4">Ürün</th>
              <th className="p-4">Sipariş</th>
              <th className="p-4 text-right">Durum</th>
            </tr>
          </thead>
          <tbody>
            {tenants.length > 0 ? (
              tenants.map((t: any) => (
                <tr key={t.id} className="border-b border-border">
                  <td className="p-4 align-top">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.slug}</div>
                  </td>
                  <td className="p-4 align-top">
                    {t.memberships.length > 0 ? t.memberships.map((membership: any) => (
                      <div key={membership.user.id} className="mb-1 text-xs">
                        <div className="font-medium">{membership.user.name}</div>
                        <div className="text-muted-foreground">{membership.user.email}</div>
                      </div>
                    )) : <span className="text-xs text-amber-500">Sahip atanmamış</span>}
                  </td>
                  <td className="p-4 align-top">
                    <form action={updateTenantPlan} className="inline">
                      <input type="hidden" name="id" value={t.id} />
                      <select
                        name="planId"
                        defaultValue={t.planId}
                        className="rounded border border-input bg-background px-2 py-1 text-xs"
                      >
                        {plans.map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.priceMonthly} TL)
                          </option>
                        ))}
                      </select>
                      <input name="reason" required minLength={5} maxLength={300} placeholder="Gerekçe" className="mt-2 w-full rounded border border-input bg-background px-2 py-1 text-xs" />
                      <SubmitButton size="sm" className="mt-2">
                        Ata
                      </SubmitButton>
                    </form>
                  </td>
                  <td className="p-4 align-top">
                    <form action={updateTenantStatus} className="inline">
                      <input type="hidden" name="id" value={t.id} />
                      <select
                        name="status"
                        defaultValue={t.status}
                        className="rounded border border-input bg-background px-2 py-1 text-xs"
                      >
                        <option value="ACTIVE">Aktif</option>
                        <option value="SUSPENDED">Askıya Al</option>
                      </select>
                      <input name="reason" required minLength={5} maxLength={300} placeholder="Gerekçe" className="mt-2 w-full rounded border border-input bg-background px-2 py-1 text-xs" />
                      <SubmitButton size="sm" className="mt-2">
                        Kaydet
                      </SubmitButton>
                    </form>
                  </td>
                  <td className="p-4 text-muted-foreground">{usage.products.get(t.id) ?? 0}</td>
                  <td className="p-4 text-muted-foreground">{usage.orders.get(t.id) ?? 0}</td>
                  <td className="p-4 text-right">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      t.status === "ACTIVE"
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-red-100 text-red-800 border-red-200"
                    }`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                    <div className="mt-2">
                      <a
                        href={`/shop/${t.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Vitrini aç →
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">İşletme yok.</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
