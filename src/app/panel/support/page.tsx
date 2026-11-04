import { createSupportTicketAction, listTenantSupportTickets, deleteOwnSupportTicketAction } from "@/actions/admin";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

export const dynamic = "force-dynamic";
const labels: Record<string,string> = { OPEN: "Açık", IN_PROGRESS: "İşlemde", WAITING_CUSTOMER: "Yanıt bekleniyor", RESOLVED: "Çözüldü", CLOSED: "Kapalı" };

export default async function TenantSupportPage() {
  const tickets = await listTenantSupportTickets();
  return (
    <div className="space-y-6">
      <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-purple-300">İŞLETME / YARDIM</p><h1 className="mt-2 text-2xl font-bold">Destek Taleplerim</h1><p className="mt-1 text-sm text-muted-foreground">Sorun veya önerilerinizi Tivarto destek ekibine iletin.</p></div>
      <form action={createSupportTicketAction} className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold">Yeni destek talebi</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-1"><Label htmlFor="subject">Konu</Label><Input id="subject" name="subject" minLength={5} maxLength={120} placeholder="Örn. Ürün görseli yüklenmiyor" required /></div>
          <div className="space-y-1"><Label htmlFor="priority">Öncelik</Label><select id="priority" name="priority" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="NORMAL">Normal</option><option value="HIGH">Yüksek</option><option value="LOW">Düşük</option></select></div>
          <div className="space-y-1 md:col-span-2"><Label htmlFor="description">Açıklama</Label><textarea id="description" name="description" minLength={10} maxLength={3000} rows={4} required className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" placeholder="Sorunu ve varsa izlediğiniz adımları açıklayın..." /></div>
          <div><SubmitButton>Destek talebi gönder</SubmitButton></div>
        </div>
      </form>
      <div className="space-y-3">
        <h2 className="font-semibold">Talep geçmişi</h2>
        {tickets.map(ticket => <article key={ticket.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-medium">{ticket.subject}</h3><span className="rounded-full bg-white/5 px-2 py-1 text-xs text-muted-foreground">{labels[ticket.status]}</span></div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{ticket.description}</p>
          {ticket.resolutionNote && <p className="mt-3 rounded-lg bg-purple-500/10 p-3 text-sm text-purple-100"><strong>Destek notu:</strong> {ticket.resolutionNote}</p>}
          <p className="mt-3 text-[11px] text-muted-foreground">Oluşturulma: {new Date(ticket.createdAt).toLocaleString("tr-TR")} · Öncelik: {ticket.priority}</p>
          {ticket.canDelete && (
            <form action={deleteOwnSupportTicketAction} className="mt-3 border-t border-border pt-3">
              <input type="hidden" name="id" value={ticket.id} />
              <ConfirmSubmitButton variant="destructive" size="sm" message="Bu destek talebini silmek istediğinize emin misiniz?">Talebimi sil</ConfirmSubmitButton>
            </form>
          )}
        </article>)}
        {tickets.length === 0 && <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">Henüz talep oluşturmadınız.</p>}
      </div>
    </div>
  );
}
