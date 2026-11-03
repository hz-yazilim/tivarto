import { createFeatureFlagAction, listFeatureFlags, setFeatureFlagAction } from "@/actions/admin";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";

export default async function FeaturesPage() {
  const flags = await listFeatureFlags();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-purple-300">PLATFORM / ÜRÜN KONTROLÜ</p>
        <h1 className="mt-2 text-2xl font-bold">Özellik Yönetimi</h1>
        <p className="mt-1 text-sm text-muted-foreground">Özellik anahtarlarını kaydedin, kontrollü açıp kapatın ve her değişikliği gerekçesiyle denetim izine yazın.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Yeni özellik anahtarı</CardTitle></CardHeader>
        <CardContent>
          <form action={createFeatureFlagAction} className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1"><Label htmlFor="key">Anahtar</Label><Input id="key" name="key" placeholder="advanced_reports" minLength={3} maxLength={60} required /></div>
            <div className="space-y-1"><Label htmlFor="name">Görünen ad</Label><Input id="name" name="name" placeholder="Gelişmiş raporlar" required /></div>
            <div className="space-y-1"><Label htmlFor="description">Açıklama</Label><Input id="description" name="description" placeholder="Ne işe yaradığını yazın" required /></div>
            <div className="space-y-1"><Label htmlFor="category">Kategori</Label><Input id="category" name="category" defaultValue="product" /></div>
            <div className="md:col-span-4"><SubmitButton>Özellik anahtarı oluştur</SubmitButton></div>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-3 lg:grid-cols-2">
        {flags.map((flag) => (
          <Card key={flag.id}>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><h2 className="font-semibold">{flag.name}</h2><span className={`rounded-full border px-2 py-0.5 text-[10px] ${flag.enabled ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-zinc-500/30 bg-zinc-500/10 text-zinc-300"}`}>{flag.enabled ? "Açık" : "Kapalı"}</span></div>
                  <p className="mt-1 text-xs text-muted-foreground">{flag.description}</p>
                  <code className="mt-2 inline-block rounded bg-background px-2 py-1 text-xs text-purple-200">{flag.key}</code>
                </div>
                <span className="text-xs text-muted-foreground">{flag.category}</span>
              </div>
              <form action={setFeatureFlagAction} className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
                <input type="hidden" name="id" value={flag.id} />
                <input type="hidden" name="enabled" value={String(!flag.enabled)} />
                <Input name="reason" placeholder="Değişiklik gerekçesi (zorunlu)" minLength={5} maxLength={300} required />
                <SubmitButton variant={flag.enabled ? "destructive" : "default"}>{flag.enabled ? "Kapat" : "Etkinleştir"}</SubmitButton>
              </form>
              <p className="mt-2 text-[11px] text-muted-foreground">Son güncelleme: {new Date(flag.updatedAt).toLocaleString("tr-TR")}</p>
            </CardContent>
          </Card>
        ))}
        {flags.length === 0 && <p className="text-sm text-muted-foreground">Henüz özellik anahtarı yok.</p>}
      </div>
      <p className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-xs leading-5 text-amber-100">Not: Bu ekran özellik anahtarlarını güvenli biçimde saklar ve denetler. Bir anahtarın uygulamadaki belirli bir modülü gerçekten açıp kapatması için ilgili modülün sunucu tarafında bu anahtarı kontrol etmesi gerekir; kayıt oluşturmak tek başına modül davranışını değiştirmez.</p>
    </div>
  );
}
