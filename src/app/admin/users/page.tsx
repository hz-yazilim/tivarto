import { listPlatformUsers, setPlatformUserSuspensionAction, deleteOrphanPlatformUserAction } from "@/actions/admin";
import { SubmitButton } from "@/components/ui/submit-button";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const users = await listPlatformUsers(q);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-purple-300">PLATFORM / HESAPLAR</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Kullanıcılar</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platforma kayıtlı hesapları ve bağlı oldukları işletmeleri görüntüleyin.</p>
      </div>
      <form method="GET" className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 sm:flex-row">
        <input type="search" name="q" defaultValue={q} maxLength={80} placeholder="Ad veya e-posta ile ara..." className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground" />
        <button type="submit" className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90">Ara</button>
        {q && <a href="/admin/users" className="inline-flex h-11 items-center justify-center rounded-xl border border-input px-4 text-sm text-muted-foreground hover:bg-accent">Temizle</a>}
      </form>
      <p className="text-sm text-muted-foreground">{users.length} hesap gösteriliyor {users.length === 200 ? "(ilk 200 sonuç)" : ""}</p>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-4">Kullanıcı</th>
                <th className="px-5 py-4">İşletmeler</th>
                <th className="px-5 py-4">Yetki</th>
                <th className="px-5 py-4">Kayıt tarihi</th>
                <th className="px-5 py-4 text-right">Oturum</th>
                <th className="px-5 py-4">Hesap durumu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-foreground">{user.name || "İsimsiz kullanıcı"}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{user.email}</div>
                  </td>
                  <td className="px-5 py-4">
                    {user.memberships.length ? user.memberships.map((membership) => (
                      <div key={membership.tenant.id} className="mb-1 text-xs">
                        <span className="text-foreground">{membership.tenant.name}</span>
                        <span className="ml-2 text-muted-foreground">/{membership.tenant.slug}</span>
                      </div>
                    )) : <span className="text-xs text-muted-foreground">İşletme üyeliği yok</span>}
                  </td>
                  <td className="px-5 py-4">
                    {user.isPlatformAdmin
                      ? <span className="rounded-full border border-purple-400/30 bg-purple-500/15 px-2.5 py-1 text-xs font-medium text-purple-200">Platform yöneticisi</span>
                      : <span className="text-xs text-muted-foreground">{user.memberships.map((m) => m.role === "OWNER" ? "İşletme sahibi" : "Personel").join(", ") || "Standart hesap"}</span>}
                  </td>
                  <td className="px-5 py-4 text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleDateString("tr-TR")}</td>
                  <td className="px-5 py-4 text-right tabular-nums text-foreground">{user._count.sessions}</td>
                  <td className="px-5 py-4">
                    {user.isPlatformAdmin ? <span className="text-xs text-muted-foreground">Korunan yönetici hesabı</span> : <form action={setPlatformUserSuspensionAction} className="flex min-w-[190px] flex-col gap-2">
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="suspended" value={String(!user.isSuspended)} />
                      <input name="reason" minLength={5} maxLength={300} required placeholder="İşlem gerekçesi" className="h-8 rounded border border-input bg-background px-2 text-xs" />
                      <SubmitButton size="sm" variant={user.isSuspended ? "default" : "destructive"}>{user.isSuspended ? "Hesabı etkinleştir" : "Hesabı askıya al"}</SubmitButton>
                    </form>}
                    <div className="mt-1 text-[10px] text-muted-foreground">{user.isSuspended ? "Askıya alınmış" : "Aktif"}</div>
                    {!user.isPlatformAdmin && user.memberships.length === 0 && (
                      <form action={deleteOrphanPlatformUserAction} className="mt-2 flex min-w-[190px] flex-col gap-2">
                        <input type="hidden" name="userId" value={user.id} />
                        <input name="reason" minLength={5} maxLength={300} required placeholder="Silme gerekçesi" className="h-8 rounded border border-input bg-background px-2 text-xs" />
                        <SubmitButton size="sm" variant="destructive">Bağlantısız hesabı sil</SubmitButton>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">Aramanızla eşleşen kullanıcı bulunamadı.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">Askıya alma geri alınabilir ve mevcut oturumları iptal eder. Platform yöneticileri bu ekrandan değiştirilemez. Kalıcı silme yalnızca hiçbir işletmeye bağlı olmayan normal hesaplarda açılır; işletme sahibi/personel hesapları bu ekrandan silinemez.</p>
    </div>
  );
}
