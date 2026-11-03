import { listTenantMembers, updateTenantMemberRoleAction, removeTenantMemberAction } from "@/actions/admin";
import { requireTenantContext } from "@/lib/session.server";
import { SubmitButton } from "@/components/ui/submit-button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const context = await requireTenantContext();
  if (context.role !== "OWNER") {
    return <div className="rounded-2xl border border-border bg-card p-8"><h1 className="text-xl font-bold">Ekip yönetimi</h1><p className="mt-2 text-sm text-muted-foreground">Bu alanı yalnızca işletme sahibi görüntüleyebilir.</p></div>;
  }
  const members = await listTenantMembers();
  const ownerCount = members.filter((member) => member.role === "OWNER").length;
  return (
    <div className="space-y-6">
      <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-purple-300">İŞLETME / EKİP</p><h1 className="mt-2 text-2xl font-bold">Ekip ve Yetkiler</h1><p className="mt-1 text-sm text-muted-foreground">İşletmenizdeki mevcut kullanıcıların sahip/personel rollerini yönetin.</p></div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">İşletme üyeleri</h2><p className="mt-1 text-xs text-muted-foreground">{members.length} üye</p></div><span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs text-purple-200">İşletme sahibi</span></div>
        <div className="mt-4 divide-y divide-border">
          {members.map((member) => <div key={member.id} className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center">
            <div><div className="font-medium">{member.user.name}</div><div className="mt-1 text-xs text-muted-foreground">{member.user.email}</div><div className="mt-1 text-[11px] text-muted-foreground">{member.user.isSuspended ? "Platform tarafından askıya alınmış hesap" : "Hesap aktif"} · Katılım kaydı: {member.id.slice(-8)}</div></div>
            <form action={updateTenantMemberRoleAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="membershipId" value={member.id} />
              <select name="role" defaultValue={member.role} className="h-9 rounded-lg border border-input bg-background px-3 text-sm"><option value="OWNER">İşletme sahibi</option><option value="STAFF">Personel</option></select>
              <input name="reason" required minLength={5} maxLength={300} placeholder="Değişiklik gerekçesi" className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-xs md:w-48" />
              <SubmitButton size="sm">Rolü kaydet</SubmitButton>
            </form>
            {member.user.id !== context.user.id && !(member.role === "OWNER" && ownerCount <= 1) && (
              <form action={removeTenantMemberAction} className="flex flex-wrap items-center gap-2 md:col-span-2">
                <input type="hidden" name="membershipId" value={member.id} />
                <input name="reason" required minLength={5} maxLength={300} placeholder="Üyelik kaldırma gerekçesi" className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-xs" />
                <ConfirmSubmitButton variant="destructive" size="sm" message="Bu kişinin işletme üyeliği kaldırılacak. Başka işletmesi yoksa hesabı ve oturumları da silinir. Devam edilsin mi?">
                  Üyeliği kaldır
                </ConfirmSubmitButton>
              </form>
            )}
          </div>)}
          {members.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Henüz üye bulunmuyor.</p>}
        </div>
      </div>
      <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-xs leading-5 text-amber-100">Güvenlik: Son işletme sahibinin rolünün düşürülmesi veya üyeliğinin kaldırılması engellenir. Üyelik kaldırma ve rol değişiklikleri denetim kayıtlarına gerekçesiyle yazılır. Yeni kullanıcı daveti e-posta altyapısı bağlanana kadar açılmamıştır; mevcut sistem hesabı olmayan kişiye davet gönderilemez.</div>
    </div>
  );
}
