import { listPayments, createPaymentAction, listTenants } from "@/actions/admin";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const [payments, tenants] = await Promise.all([listPayments(), listTenants()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ödeme Yönetimi</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yeni Ödeme Kaydı Ekle</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <form action={createPaymentAction} className="grid items-end gap-3 md:grid-cols-4">
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="tenantId">İşletme</Label>
              <select
                id="tenantId"
                name="tenantId"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Seçiniz</option>
                {tenants.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.slug})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="amount">Tutar (TL)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Açıklama</Label>
              <Input id="description" name="description" placeholder="Abonelik ödemesi" />
            </div>
            <SubmitButton>Kaydet</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ödeme Geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {payments.length > 0 ? (
              payments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <div className="font-medium">{p.tenant?.name || p.tenantId}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.description || "-"} ·
                      {new Date(p.createdAt).toLocaleString("tr-TR")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${p.status === "PAID" ? "text-green-700" : "text-muted-foreground"}`}>
                      {Number(p.amount).toLocaleString("tr-TR")} TL
                    </div>
                    <div className="text-xs text-muted-foreground">{p.status}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground p-4">Henüz ödeme kaydı yok.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
