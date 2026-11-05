import Link from "next/link";
import AccountDeletionRequestForm from "@/components/account-deletion-request-form";
import AccountDeletionStatus from "@/components/account-deletion-status";

export const dynamic = "force-dynamic";

export default function AccountDeletionRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-12 text-white">
      <section className="w-full rounded-3xl border border-white/10 bg-[#15121f] p-6 shadow-2xl sm:p-9">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 text-xl font-black">T</span>
          <span className="text-xl font-bold">tivarto<span className="text-purple-300">.</span></span>
        </div>
        <p className="text-xs font-bold uppercase tracking-[.2em] text-purple-300">HESAP VE GİZLİLİK</p>
        <h1 className="mt-3 text-3xl font-extrabold">Hesap silme talebi</h1>
        <p className="mt-3 text-sm leading-7 text-zinc-300">
          Tivarto hesabınıza erişemiyorsanız, hesabınıza kayıtlı e-posta adresiyle silme talebi gönderebilirsiniz. E-posta adresinin size ait olduğunu doğrulamak için 24 saat geçerli bir bağlantı gönderilir.
        </p>
        <AccountDeletionRequestForm />
        <AccountDeletionStatus />
        <div className="mt-7 border-t border-white/10 pt-5 text-xs leading-6 text-zinc-400">
          Hesap silindiğinde giriş bilgileriniz ve hesabınıza ait oturumlar kaldırılır. İşletme kayıtları, diğer kullanıcıların çalışmasını ve yasal saklama yükümlülüklerini korumak için ayrı değerlendirilir. İşletme sahibi hesaplarında önce sahiplik devri gerekebilir.
          <p className="mt-3"><Link href="/gizlilik" className="text-purple-300 underline">Gizlilik politikası</Link></p>
        </div>
      </section>
    </main>
  );
}
