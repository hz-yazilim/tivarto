import Link from "next/link";
import { DEMO_ACTIVE } from "@/lib/demo-config";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function PanelSecimiPage() {
  if (DEMO_ACTIVE) redirect("/admin");
  return (
    <main className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center overflow-hidden px-4 py-12">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-purple-700/15 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 bottom-10 h-72 w-72 rounded-full bg-rose-700/10 blur-3xl" />
      <section className="relative z-10 w-full">
        <div className="mb-8 text-center">
          <div className="tiverto-gradient mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black text-white">T</div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-purple-300">TİVERTO</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Hangi paneli açmak istersiniz?</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
            Devam etmek istediğiniz alanı seçin. Seçiminizi daha sonra da değiştirebilirsiniz.
          </p>
        </div>

        <div className="mx-auto max-w-md">
          <Link href="/panel" className="tiverto-card group block rounded-2xl p-6 transition hover:-translate-y-1 hover:border-purple-400/40">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-300/15 bg-purple-500/10 text-3xl">🏪</div>
            <h2 className="text-lg font-bold text-zinc-100">İşletme Paneli</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Ürünlerinizi, stoklarınızı, siparişlerinizi ve mağazanızı yönetin.</p>
            <span className="mt-5 inline-flex font-semibold text-purple-300">Panele geç →</span>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-zinc-500 transition hover:text-purple-300">← Ana sayfaya dön</Link>
        </div>
      </section>
    </main>
  );
}
