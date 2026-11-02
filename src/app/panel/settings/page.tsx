import { getTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";
import { getSettingsAction } from "@/actions/settings";
import SettingsForm from "@/components/settings-form";

export default async function SettingsPage() {
  const { tenant } = await getTenantContext();

  const settings = await getSettingsAction(tenant.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mağaza Ayarları</h1>
          <p className="text-muted-foreground text-sm">
            İnternet mağazanızın görünüm ve iletişim bilgilerini düzenleyin.
          </p>
        </div>
      </div>

      <SettingsForm initial={settings} />
    </div>
  );
}
