import { getTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";
import { createSupplierAction, deleteSupplierAction } from "@/actions/parties";
import { SubmitButton } from "@/components/ui/submit-button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const { tenant } = await getTenantContext();

  const data = await withTenant(tenant.id, async (tx) => {
    const suppliers = await tx.supplier.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { suppliers };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tedarikçi Yönetimi</h1>
          <p className="text-muted-foreground text-sm">
            Tedarikçi kartlarınızı ve alınan ürünlerinizi takip edin.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yeni Tedarikçi Ekle</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <form action={createSupplierAction} className="grid gap-3 md:grid-cols-4 items-end">
            <div className="space-y-1">
              <Label htmlFor="name">Tedarikçi Adı / Ünvan</Label>
              <Input id="name" name="name" placeholder="Örn. Bahar Tedarik" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contactPerson">Yetkili Kişi</Label>
              <Input id="contactPerson" name="contactPerson" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" name="phone" placeholder="0532 123 45 67" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <SubmitButton>Ekle</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tedarikçi Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {data.suppliers.length > 0 ? (
              data.suppliers.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.contactPerson || "-"} · {s.phone || "-"} · {s.email || "-"}
                    </div>
                  </div>
                  <form action={deleteSupplierAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <ConfirmSubmitButton
                      variant="destructive"
                      size="sm"
                      message="Bu tedarikçiyi silmek istediğinize emin misiniz? Mal kabul kayıtları korunur."
                    >
                      Sil
                    </ConfirmSubmitButton>
                  </form>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground p-4">Henüz tedarikçi yok.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
