import { requireSession } from "@/lib/session.server";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await requireSession();
  } catch {
    redirect("/login");
  }
  if (!session.user.isPlatformAdmin) {
    redirect("/panel");
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background sticky top-0 z-10">
          <h1 className="text-lg font-semibold">Platform Yönetim Paneli</h1>
          <div className="text-xs text-muted-foreground">
            Merkezi İşletme Yönetimi
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-secondary p-6">{children}</main>
      </div>
    </div>
  );
}
