import { requirePlatformAdmin } from "@/lib/session.server";
import AdminSidebar from "@/components/admin-sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePlatformAdmin();

  return (
    <div className="min-h-screen bg-secondary">
      <div className="flex h-[100dvh] min-h-screen">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="z-10 flex items-center justify-between border-b border-border bg-background px-3 py-2.5 sm:px-4 sm:py-3 md:px-6">
            <h1 className="truncate text-sm font-semibold sm:text-base md:text-lg">
              Platform Yönetim Paneli
            </h1>
            <div className="hidden text-xs text-muted-foreground sm:block">
              Merkezi işletme yönetimi
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
