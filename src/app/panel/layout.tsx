import { getTenantContext } from "@/lib/session.server";
import { redirect } from "next/navigation";
import PanelSidebar from "@/components/panel-sidebar";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let tenant: { name: string; slug: string };
  try {
    const ctx = await getTenantContext();
    tenant = ctx.tenant;
  } catch {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-background">
      <PanelSidebar tenant={tenant} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">{tenant.name}</h1>
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
          </div>
          <div className="text-xs text-muted-foreground">
            Yönetim Paneli
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-secondary p-6">{children}</main>
      </div>
    </div>
  );
}
