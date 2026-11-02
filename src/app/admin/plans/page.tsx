import { listPlans, createPlanAction, deletePlanAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PlansPage() {
  const plans = await listPlans();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Abonelik Planları</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yeni Plan Oluştur</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <form action={createPlanAction} className="grid gap-3 md:grid-cols-5 items-end">
            <div className="space-y-1">
              <Label htmlFor="name">Plan Adı</Label>
              <Input id="name" name="name" placeholder="Başlangıç" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="priceMonthly">Aylık Fiyat (TL)</Label>
              <Input id="priceMonthly" name="priceMonthly" type="number" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="maxProducts">Maks. Ürün</Label>
              <Input id="maxProducts" name="maxProducts" type="number" defaultValue="500" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="maxStorageMb">Maks. Depolama (MB)</Label>
              <Input id="maxStorageMb" name="maxStorageMb" type="number" defaultValue="5000" />
            </div>
            <Button type="submit">Oluştur</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {plans.length > 0 ? (
              plans.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.priceMonthly.toLocaleString("tr-TR")} TL / ay ·
                      {p.maxProducts} ürün · {p.maxStorageMb} MB
                    </div>
                  </div>
                  <form action={deletePlanAction} className="inline" onSubmit={(e) => {
                    if (!confirm("Bu planı silmek istediğinize emin misiniz?")) e.preventDefault();
                  }}>
                    <input type="hidden" name="id" value={p.id} />
                    <Button type="submit" variant="destructive" size="sm">
                      Sil
                    </Button>
                  </form>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground p-4">Henüz plan yok.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
