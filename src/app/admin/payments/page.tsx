import { listPayments, createPaymentAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PaymentsPage() {
  const payments = await listPayments();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ödeme Yönetimi</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yeni Ödeme Kaydı Ekle</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <form action={createPaymentAction} className="grid gap-3 md:grid-cols-4 items-end">
            <div className="space-y-1">
              <Label htmlFor="tenantId">İşletme ID</Label>
              <Input id="tenantId" name="tenantId" placeholder="cuid..." required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="amount">Tutar (TL)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Açıklama</Label>
              <Input id="description" name="description" placeholder="Abonelik ödemesi" />
            </div>
            <Button type="submit">Kaydet</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ödeme Geçmişi</CardTitle>
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
                      {p.amount.toLocaleString("tr-TR")} TL
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
