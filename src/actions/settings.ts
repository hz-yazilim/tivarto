"use server";

import { getTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";

export async function getSettingsAction(tenantId: string) {
  return withTenant(tenantId, async (tx) => {
    return tx.storeSettings.findUnique({ where: { tenantId } });
  });
}

export async function updateSettingsAction(prevState: any, formData: FormData) {
  const { tenant } = await getTenantContext();
  await withTenant(tenant.id, async (tx) => {
    const settings = await tx.storeSettings.findUnique({
      where: { tenantId: tenant.id },
    });
    const data = {
      logoUrl: (formData.get("logoUrl") as string) || undefined,
      coverUrl: (formData.get("coverUrl") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      whatsapp: (formData.get("whatsapp") as string) || undefined,
      address: (formData.get("address") as string) || undefined,
      mapsUrl: (formData.get("mapsUrl") as string) || undefined,
      theme: ((formData.get("theme") as string) || "default") as string,
    };
    if (settings) {
      await tx.storeSettings.update({ where: { tenantId: tenant.id }, data });
    } else {
      await tx.storeSettings.create({ data: { tenantId: tenant.id, ...data } });
    }
  });
  return { ok: true };
}
