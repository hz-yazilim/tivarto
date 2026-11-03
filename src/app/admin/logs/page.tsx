import { listAuditLogs, listPlatformAuditLogs } from "@/actions/admin";

export const dynamic = "force-dynamic";

export default async function LogsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [tenantLogs, platformLogs] = await Promise.all([listAuditLogs(), listPlatformAuditLogs(q)]);
  return (
    <div className="space-y-6">
      <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-purple-300">PLATFORM / GÜVENLİK</p><h1 className="mt-2 text-2xl font-bold">Denetim Kayıtları</h1><p className="mt-1 text-sm text-muted-foreground">Platform yöneticisi işlemleri ve işletme etkinliklerini inceleyin.</p></div>
      <form method="GET" className="flex gap-2 rounded-xl border border-border bg-card p-3"><input name="q" defaultValue={q} maxLength={80} placeholder="İşlem, hedef veya kullanıcı kimliği ile ara..." className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm" /><button className="rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">Ara</button>{q && <a href="/admin/logs" className="rounded-lg border border-input px-3 py-2 text-sm">Temizle</a>}<a href="/admin/logs/export" className="rounded-lg border border-input px-3 py-2 text-sm">CSV indir</a></form>
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-4"><h2 className="font-semibold">Platform işlemleri</h2><p className="text-xs text-muted-foreground">Son 200 kayıt · Değişiklik öncesi/sonrası ve gerekçe</p></div>
        <div className="divide-y divide-border">
          {platformLogs.map((l) => <article key={l.id} className="p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-semibold">{l.action}</span><time className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString("tr-TR")}</time></div><p className="mt-1 text-xs text-muted-foreground">{l.targetType} · {l.targetId || "-"} · Yönetici: {l.actorId || "-"}</p>{l.reason && <p className="mt-2 text-xs text-foreground/80">Gerekçe: {l.reason}</p>}</article>)}
          {platformLogs.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Eşleşen platform kaydı yok.</p>}
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border p-4"><h2 className="font-semibold">İşletme etkinlikleri</h2><p className="text-xs text-muted-foreground">Son 100 kayıt · İşletme bazlı</p></div>
        <div className="divide-y divide-border">
          {tenantLogs.map((l: any) => <article key={l.id} className="p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-medium">{l.action}</span><time className="text-xs text-muted-foreground">{new Date(l.createdAt).toLocaleString("tr-TR")}</time></div><p className="mt-1 text-xs text-muted-foreground">{l.entity} {l.entityId || ""} · {l.tenant?.name || "platform"} · Kullanıcı: {l.userId || "-"}</p>{l.details && <p className="mt-1 text-xs text-muted-foreground">Açıklama: {l.details}</p>}</article>)}
          {tenantLogs.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Henüz işletme kaydı yok.</p>}
        </div>
      </section>
      <p className="text-xs text-muted-foreground">Platform denetim kayıtları uygulama arayüzünde düzenlenemez veya silinemez. Veritabanı yöneticisi düzeyindeki müdahaleler için ayrıca altyapı erişim denetimi gerekir.</p>
    </div>
  );
}
