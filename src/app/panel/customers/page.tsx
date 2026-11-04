import { getTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";
import { createCustomerAction, deleteCustomerAction } from "@/actions/parties";
import { SubmitButton } from "@/components/ui/submit-button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const { tenant } = await getTenantContext();

  const data = await withTenant(tenant.id, async (tx) => {
    const customers = await tx.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orders: true } } },
    });
    return { customers };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Müşteri Yönetimi</h1>
          <p className="text-muted-foreground text-sm">
            Müşteri kartlarınızı ve sipariş geçmişinizi takip edin.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yeni Müşteri Ekle</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <form action={createCustomerAction} className="grid gap-3 md:grid-cols-4 items-end">
            <div className="space-y-1">
              <Label htmlFor="name">Ad Soyad / Ünvan</Label>
              <Input id="name" name="name" placeholder="Örn. Ali Demir" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" name="phone" placeholder="0532 123 45 67" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="address">Adres</Label>
              <Input id="address" name="address" />
            </div>
            <SubmitButton>Ekle</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Müşteri Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {data.customers.length > 0 ? (
              data.customers.map((c: any) => (
                <div key={c.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="break-words font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.phone || "-"} · {c.email || "-"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {c._count.orders} sipariş
                    </span>
                    <form action={deleteCustomerAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <ConfirmSubmitButton
                      variant="destructive"
                      size="sm"
                      message="Bu müşteriyi silmek istediğinize emin misiniz? Geçmiş siparişler korunur."
                    >
                        Sil
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground p-4">Henüz müşteri yok.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
