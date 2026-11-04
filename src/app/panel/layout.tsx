import { requireTenantContext } from "@/lib/session.server";
import PanelSidebar from "@/components/panel-sidebar";
import TenantStatusGuard from "@/components/tenant-status-guard";
import PanelOnboarding from "@/components/panel-onboarding";

export const dynamic = "force-dynamic";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { tenant, user, role } = await requireTenantContext();

  return (
    <div className="min-h-screen bg-secondary">
      {tenant.status === "SUSPENDED" && <TenantStatusGuard role={role} />}
      <div className="flex h-screen">
        <PanelSidebar
          tenant={{ name: tenant.name, slug: tenant.slug }}
          user={{ name: user.name ?? user.email, isPlatformAdmin: user.isPlatformAdmin }}
          role={role}
        />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="z-10 flex items-center justify-between gap-3 border-b border-border bg-background px-4 py-3 md:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground md:hidden">
                T
              </span>
              <h1 className="truncate text-base font-semibold md:text-lg">
                {tenant.name}
              </h1>
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  tenant.status === "ACTIVE" ? "bg-green-500" : "bg-red-500"
                }`}
                title={tenant.status === "ACTIVE" ? "Aktif" : "Askıda"}
              />
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="hidden sm:inline">Yönetim Paneli</span>
              <a
                href="/panel/akilli-analiz"
                data-tour="smart-analysis-link"
                className="rounded-md border border-input px-2 py-1 font-medium text-foreground hover:bg-accent"
              >
                Akıllı Analiz
              </a>
              <a
                href={`/shop/${tenant.slug}`}
                className="rounded-md border border-input px-2 py-1 font-medium text-foreground hover:bg-accent"
              >
                Vitrin
              </a>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
          <PanelOnboarding userId={user.id} tenantId={tenant.id} />
        </div>
      </div>
    </div>
  );
}
