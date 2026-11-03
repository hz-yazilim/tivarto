import { redirect } from "next/navigation";
import { getSession } from "@/lib/session.server";
import { withPlatform } from "@/lib/db";
import { switchActiveTenantAction } from "@/actions/auth";

export const dynamic = "force-dynamic";

export default async function PanelSecimiPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.mustChangePassword) redirect("/change-password");
  if (session.user.isPlatformAdmin) redirect("/admin");

  const memberships = await withPlatform((tx) =>
    tx.membership.findMany({
      where: { userId: session.user.id },
      orderBy: { tenant: { name: "asc" } },
      select: {
        id: true,
        role: true,
        tenant: { select: { id: true, name: true, slug: true, status: true } },
      },
    })
  );

  if (memberships.length === 0) redirect("/hesap-yok");
  if (memberships.length === 1) redirect("/panel");

  return (
    <main className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center overflow-hidden px-4 py-12">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-purple-700/15 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 bottom-10 h-72 w-72 rounded-full bg-rose-700/10 blur-3xl" />
      <section className="relative z-10 w-full">
        <div className="mb-8 text-center">
          <div className="tiverto-gradient mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black text-white">T</div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-purple-300">TİVARTO</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">İşletmeni seç</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
            Bu hesap birden fazla işletmeye bağlı. Yönetmek istediğin işletmeyi seç.
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          {memberships.map(({ id, role, tenant }) => (
            <form key={id} action={switchActiveTenantAction} className="tiverto-card rounded-2xl p-5">
              <input type="hidden" name="tenantId" value={tenant.id} />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-zinc-100">{tenant.name}</h2>
                  <p className="mt-1 truncate text-xs text-zinc-400">/shop/{tenant.slug}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${tenant.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>
                  {tenant.status === "ACTIVE" ? "Aktif" : "Askıda"}
                </span>
              </div>
              <p className="mt-3 text-xs text-zinc-400">{role === "OWNER" ? "İşletme sahibi" : "Personel"}</p>
              <button type="submit" className="mt-5 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
                Bu işletmeye geç
              </button>
            </form>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a href="/logout" className="text-sm text-zinc-500 transition hover:text-purple-300">Çıkış yap</a>
        </div>
      </section>
    </main>
  );
}
