import { isDatabaseHealthy } from "@/lib/db";
import { DEMO_ACTIVE } from "@/lib/demo-config";
import { Activity, Database, Mail, ShieldCheck, Server } from "lucide-react";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function SystemHealthPage() {
  const databaseHealthy = DEMO_ACTIVE ? null : await isDatabaseHealthy();
  const checks = [
    { name: "Uygulama", detail: "Next.js sunucu süreci", ok: true, icon: Server },
    { name: "Veritabanı", detail: DEMO_ACTIVE ? "Demo veri katmanı kullanılıyor" : "PostgreSQL bağlantı kontrolü", ok: databaseHealthy, icon: Database },
    { name: "E-posta servisi", detail: "SMTP / e-posta sağlayıcısı entegrasyonu", ok: Boolean(process.env.EMAIL_SERVER_HOST), icon: Mail },
    { name: "Ödeme sağlayıcısı", detail: "Ödeme API anahtarı tanımlı mı?", ok: Boolean(process.env.PAYMENT_PROVIDER_SECRET), icon: ShieldCheck },
  ];
  return (
    <div className="space-y-6">
      <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-purple-300">PLATFORM / ALTYAPI</p><h1 className="mt-2 text-2xl font-bold">Sistem Durumu</h1><p className="mt-1 text-sm text-muted-foreground">Uygulama, veritabanı ve entegrasyon yapılandırmalarının güvenli durum özeti.</p></div>
      <div className="grid gap-3 md:grid-cols-2">
        {checks.map(check => <div key={check.name} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-200"><check.icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h2 className="font-semibold">{check.name}</h2><p className="text-xs text-muted-foreground">{check.detail}</p></div><span className={`rounded-full px-2.5 py-1 text-xs ${check.ok === true ? "bg-emerald-500/10 text-emerald-300" : check.ok === false ? "bg-rose-500/10 text-rose-300" : "bg-amber-500/10 text-amber-200"}`}>{check.ok === true ? "Hazır" : check.ok === false ? "Bağlı değil" : "Demo"}</span></div>
        </div>)}
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold">Çalışma ortamı</h2>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Mod</p><p className="mt-1 font-medium">{DEMO_ACTIVE ? "Demo" : "Veritabanı"}</p></div><div><p className="text-xs text-muted-foreground">Node.js</p><p className="mt-1 font-medium">{process.version}</p></div><div><p className="text-xs text-muted-foreground">Ortam</p><p className="mt-1 font-medium">{process.env.NODE_ENV || "unknown"}</p></div></div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">Bu ekran gizli anahtarların değerlerini göstermez. E-posta ve ödeme kontrolleri yalnızca ilgili ortam değişkeninin varlığını denetler; gerçek sağlayıcı bağlantı testi değildir. Gerçek bağlantı testi entegrasyonlar eklendiğinde ayrıca yapılmalıdır.</p>
      </div>
    </div>
  );
}
