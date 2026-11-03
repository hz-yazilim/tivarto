import LoginForm from "@/components/login-form";
import DemoRoleSwitcher from "@/components/demo-role-switcher";
import { safeCallbackUrl } from "@/lib/constants";
import { DEMO_ACTIVE } from "@/lib/demo-config";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl: rawCallback } = await searchParams;
  const callbackUrl = safeCallbackUrl(rawCallback) ?? "";
  const isAdminLogin = callbackUrl === "/admin" || callbackUrl.startsWith("/admin/");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full bg-purple-700/20 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-rose-700/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-7 inline-flex items-center gap-3">
            <span className="tiverto-gradient flex h-11 w-11 items-center justify-center rounded-xl text-xl font-black text-white shadow-lg shadow-purple-950/40">T</span>
            <span className="text-2xl font-bold tracking-tight">tivarto<span className="text-purple-300">.</span></span>
          </Link>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-purple-300">TEKRAR HOŞ GELDİN</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">Hesabına giriş yap</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {isAdminLogin ? "Tivarto platform yönetimine devam et." : "İşletmeni yönetmeye kaldığın yerden devam et."}
          </p>
        </div>

        <section className="tiverto-glass rounded-2xl p-5 sm:p-7">
          {DEMO_ACTIVE ? (
            <div>
              <div className="mb-5 rounded-xl border border-amber-400/20 bg-amber-400/[0.08] p-4 text-sm leading-6 text-amber-100/90">
                <strong className="block text-amber-100">Demo modu aktif</strong>
                Şu anda yalnızca platform yöneticisi girişi açıktır.
              </div>
              <DemoRoleSwitcher callbackUrl="/admin" adminOnly />
            </div>
          ) : (
            <LoginForm
              demoActive={false}
              callbackUrl={callbackUrl}
              defaultRole={isAdminLogin ? "admin" : "business"}
            />
          )}
        </section>

        <p className="mt-6 text-center text-xs text-zinc-500">
          <Link href="/" className="hover:text-purple-300">← Ana sayfaya dön</Link>
        </p>
      </div>
    </main>
  );
}
