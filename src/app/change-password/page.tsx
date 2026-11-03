import { changePasswordAction } from "@/actions/auth";
import { getSession } from "@/lib/session.server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.user.mustChangePassword) redirect(session.user.isPlatformAdmin ? "/admin" : "/panel");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-7 text-white shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 text-xl font-black">T</div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-violet-300">HESAP GÜVENLİĞİ</p>
          <h1 className="mt-2 text-2xl font-bold">Yeni şifreni belirle</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">İlk giriş için kullandığın geçici şifreyi değiştirmen gerekiyor. Yeni şifren en az 12 karakter olmalı.</p>
        </div>
        {error === "short" && <p role="alert" className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">Şifre en az 12 karakter olmalı.</p>}
        {error === "mismatch" && <p role="alert" className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">Şifreler eşleşmiyor.</p>}
        <form action={changePasswordAction} className="space-y-4">
          <label className="block text-sm">Yeni şifre<input name="password" type="password" autoComplete="new-password" minLength={12} required className="mt-2 h-11 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-white outline-none focus:border-violet-400" /></label>
          <label className="block text-sm">Yeni şifre (tekrar)<input name="confirmation" type="password" autoComplete="new-password" minLength={12} required className="mt-2 h-11 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-white outline-none focus:border-violet-400" /></label>
          <button type="submit" className="h-11 w-full rounded-lg bg-violet-600 font-semibold transition hover:bg-violet-500">Şifremi Güncelle</button>
        </form>
      </section>
    </main>
  );
}
