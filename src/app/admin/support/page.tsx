import { listSupportTickets, updateSupportTicketAction, deleteSupportTicketAdminAction } from "@/actions/admin";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

export const dynamic = "force-dynamic";
const labels: Record<string, string> = { OPEN: "Açık", IN_PROGRESS: "İşlemde", WAITING_CUSTOMER: "Müşteri yanıtı bekleniyor", RESOLVED: "Çözüldü", CLOSED: "Kapalı" };

export default async function SupportAdminPage() {
  const tickets = await listSupportTickets();
  return (
    <div className="space-y-6">
      <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-purple-300">PLATFORM / MÜŞTERİ İLİŞKİLERİ</p><h1 className="mt-2 text-2xl font-bold">Destek Merkezi</h1><p className="mt-1 text-sm text-muted-foreground">İşletmelerden gelen talepleri öncelik ve durumlarına göre takip edin.</p></div>
      <div className="grid gap-3 sm:grid-cols-3">
        {(["OPEN","IN_PROGRESS","WAITING_CUSTOMER"] as const).map((status) => <div key={status} className="rounded-xl border border-border bg-card p-4"><div className="text-xs text-muted-foreground">{labels[status]}</div><div className="mt-1 text-2xl font-bold tabular-nums">{tickets.filter(t => t.status === status).length}</div></div>)}
      </div>
      <div className="space-y-3">
        {tickets.map((ticket) => <section key={ticket.id} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{ticket.subject}</h2><span className="rounded-full bg-purple-500/10 px-2 py-1 text-[10px] text-purple-200">{ticket.priority}</span><span className="rounded-full bg-white/5 px-2 py-1 text-[10px] text-muted-foreground">{labels[ticket.status]}</span></div><p className="mt-1 text-xs text-muted-foreground">{ticket.tenant.name} · {ticket.creator?.name || ticket.creator?.email || "Kullanıcı"} · {new Date(ticket.createdAt).toLocaleString("tr-TR")}</p></div>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-foreground/90">{ticket.description}</p>
          <form action={updateSupportTicketAction} className="mt-4 grid gap-2 border-t border-border pt-4 md:grid-cols-4">
            <input type="hidden" name="id" value={ticket.id} />
            <select name="status" defaultValue={ticket.status} className="h-10 rounded-lg border border-input bg-background px-3 text-sm">{Object.entries(labels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select>
            <Input name="resolutionNote" defaultValue={ticket.resolutionNote || ""} placeholder="Kullanıcıya gösterilecek çözüm notu" maxLength={1500} />
            <Input name="reason" placeholder="İşlem gerekçesi" minLength={5} maxLength={300} required />
            <SubmitButton>Talebi güncelle</SubmitButton>
          </form>
          <form action={deleteSupportTicketAdminAction} className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <input type="hidden" name="id" value={ticket.id} />
            <Input name="reason" placeholder="Silme gerekçesi (zorunlu)" minLength={5} maxLength={300} required />
            <ConfirmSubmitButton variant="destructive" message="Bu destek talebi kalıcı olarak silinecek. Devam edilsin mi?">Talebi sil</ConfirmSubmitButton>
          </form>
        </section>)}
        {tickets.length === 0 && <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">Henüz destek talebi yok.</div>}
      </div>
    </div>
  );
}
