"use client";

import { useActionState } from "react";
import { deleteOwnAccountAction, type AccountDeletionState } from "@/actions/account";

const initialState: AccountDeletionState = {};

export default function AccountPage() {
  const [state, action, pending] = useActionState(deleteOwnAccountAction, initialState);

  return (
    <main className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-purple-300">HESAP / GİZLİLİK</p>
        <h1 className="mt-2 text-2xl font-bold">Hesabım ve verilerim</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Tivarto hesabınızı kalıcı olarak silebilirsiniz. Bu işlem geri alınamaz.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h2 className="font-semibold">Hesap silindiğinde ne olur?</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
          <li>Giriş bilgileriniz, profil adınız ve hesabınıza ait oturumlar silinir.</li>
          <li>İşletme personeli üyelikleriniz kaldırılır.</li>
          <li>İşletmenin ürün, stok, sipariş, müşteri ve tedarikçi kayıtları diğer kullanıcıların iş akışını bozmamak için korunur.</li>
          <li>Denetim ve destek kayıtlarındaki hesabınızla doğrudan bağlantılı kullanıcı bilgileri mümkün olan yerlerde anonimleştirilir.</li>
          <li>Yasal olarak saklanması zorunlu olabilecek ticari kayıtlar, ilgili saklama süresi boyunca korunabilir.</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-rose-400/30 bg-rose-500/[0.04] p-5 sm:p-6">
        <h2 className="font-semibold text-rose-200">Hesabı kalıcı olarak sil</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Bir işletmenin sahibiyseniz önce sahipliği başka bir yetkiliye devretmelisiniz. Son işletme sahibinin hesabını silmek işletmeyi ve diğer kullanıcıları kilitleyebileceğinden bu işlem engellenir.
        </p>

        {state.error && (
          <div role="alert" className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            {state.error}
          </div>
        )}

        <form action={action} className="mt-5 space-y-4">
          <label className="block space-y-2 text-sm">
            <span className="font-medium">Mevcut şifreniz</span>
            <input name="password" type="password" autoComplete="current-password" required maxLength={256} className="h-11 w-full rounded-lg border border-input bg-background px-3" />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="font-medium">Onaylamak için HESABIMI SIL yazın</span>
            <input name="confirmation" required maxLength={32} autoComplete="off" className="h-11 w-full rounded-lg border border-input bg-background px-3" />
          </label>
          <button disabled={pending} type="submit" className="h-11 w-full rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60">
            {pending ? "Hesap siliniyor..." : "Hesabımı ve kişisel hesap verilerimi sil"}
          </button>
        </form>
      </section>
    </main>
  );
}
