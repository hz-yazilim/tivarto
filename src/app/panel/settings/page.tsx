import { getTenantContext } from "@/lib/session.server";
import { getSettingsAction } from "@/actions/settings";
import SettingsForm from "@/components/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { tenant } = await getTenantContext();
  const settings = await getSettingsAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mağaza Ayarları</h1>
        <p className="text-sm text-muted-foreground">
          Vitrininizin görünümünü ve iletişim bilgilerini düzenleyin.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        Vitrin adresiniz:{" "}
        <a
          href={`/shop/${tenant.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary hover:underline"
        >
          /shop/{tenant.slug}
        </a>
      </div>

      <SettingsForm
        initial={
          settings
            ? {
                logoUrl: settings.logoUrl,
                coverUrl: settings.coverUrl,
                description: settings.description,
                phone: settings.phone,
                whatsapp: settings.whatsapp,
                address: settings.address,
                mapsUrl: settings.mapsUrl,
                theme: settings.theme,
              }
            : null
        }
      />
    </div>
  );
}
