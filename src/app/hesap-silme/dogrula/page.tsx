import Link from "next/link";
import { completeExternalAccountDeletionAction } from "@/actions/account-deletion";
import { getDeletionLinkState } from "@/lib/account-deletion.server";

export const dynamic = "force-dynamic";

export default async function VerifyAccountDeletionPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const state = await getDeletionLinkState(token);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-12 text-white">
      <section className="w-full rounded-3xl border border-white/10 bg-[#15121f] p-6 shadow-2xl sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-purple-300">TİVARTO / E-POSTA DOĞRULAMA</p>
        {state === "READY" ? (
          <>
            <h1 className="mt-3 text-2xl font-extrabold">Hesap silme talebini onayla</h1>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              E-posta adresine gönderilen bağlantıyı açtın. Devam edersen Tivarto hesabın ve giriş bilgilerin kalıcı olarak silinir. İşletmenin ortak kayıtları ve diğer kullanıcıların hesapları silinmez.
            </p>
            <form action={completeExternalAccountDeletionAction} className="mt-6">
              <input type="hidden" name="token" value={token} />
              <button type="submit" className="h-12 w-full rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-500">
                Hesabımı kalıcı olarak sil
              </button>
            </form>
          </>
        ) : state === "EXPIRED" ? (
          <>
            <h1 className="mt-3 text-2xl font-extrabold">Bağlantının süresi doldu</h1>
            <p className="mt-3 text-sm leading-7 text-zinc-300">Güvenlik nedeniyle bağlantı 24 saat geçerlidir. Yeni bir hesap silme talebi oluşturabilirsin.</p>
            <Link href="/hesap-silme" className="mt-6 inline-flex h-11 items-center rounded-xl bg-purple-600 px-5 text-sm font-semibold">Yeni talep oluştur</Link>
          </>
        ) : state === "ALREADY_VERIFIED" ? (
          <>
            <h1 className="mt-3 text-2xl font-extrabold">Talep doğrulanmış</h1>
            <p className="mt-3 text-sm leading-7 text-zinc-300">Bu talep zaten doğrulanmış. İşletme sahibiysen önce işletme sahipliğini devretmen gerekir; ardından uygulama içindeki Hesabım bölümünden silme işlemini tamamlayabilirsin.</p>
          </>
        ) : (
          <>
            <h1 className="mt-3 text-2xl font-extrabold">Bağlantı geçersiz</h1>
            <p className="mt-3 text-sm leading-7 text-zinc-300">Bu bağlantı kullanılamıyor veya daha önce kullanılmış olabilir. Yeni bir talep oluşturabilirsin.</p>
            <Link href="/hesap-silme" className="mt-6 inline-flex h-11 items-center rounded-xl bg-purple-600 px-5 text-sm font-semibold">Hesap silme talebi oluştur</Link>
          </>
        )}
      </section>
    </main>
  );
}
