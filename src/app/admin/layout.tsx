import { requirePlatformAdmin } from "@/lib/session.server";
import AdminSidebar from "@/components/admin-sidebar";
import DemoBanner from "@/components/demo-banner";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdmin();

  return (
    <div className="min-h-screen bg-secondary">
      <div className="flex h-screen">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="z-10 flex items-center justify-between border-b border-border bg-background px-4 py-3 md:px-6">
            <h1 className="truncate text-base font-semibold md:text-lg">
              Platform Yönetim Paneli
            </h1>
            <div className="hidden text-xs text-muted-foreground sm:block">
              Merkezi işletme yönetimi
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <DemoBanner />
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
