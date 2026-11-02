"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";
import { optionalStr, str, type FormState } from "@/lib/validation";

export async function getSettingsAction(tenantId: string) {
  return withTenant(tenantId, async (tx) => {
    return tx.storeSettings.findUnique({ where: { tenantId } });
  });
}

export async function updateSettingsAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { tenant, user } = await requireTenantContext();

  const theme = str(formData, "theme") || "default";
  if (!["default", "modern", "minimal"].includes(theme)) {
    return { error: "Geçersiz tema." };
  }

  await withTenant(tenant.id, async (tx) => {
    const where = { tenantId: tenant.id };
    const data = {
      logoUrl: optionalStr(formData, "logoUrl") ?? null,
      coverUrl: optionalStr(formData, "coverUrl") ?? null,
      description: optionalStr(formData, "description") ?? null,
      phone: optionalStr(formData, "phone") ?? null,
      whatsapp: optionalStr(formData, "whatsapp") ?? null,
      address: optionalStr(formData, "address") ?? null,
      mapsUrl: optionalStr(formData, "mapsUrl") ?? null,
      theme,
    };

    const existing = await tx.storeSettings.findUnique({ where });
    if (existing) {
      await tx.storeSettings.update({ where, data });
    } else {
      await tx.storeSettings.create({ data: { tenantId: tenant.id, ...data } });
    }

    await tx.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        action: "storeSettings.update",
        entity: "StoreSettings",
        entityId: tenant.id,
      },
    });
  });

  revalidatePath("/panel/settings");
  revalidatePath(`/shop/${tenant.slug}`);
  return { ok: true, message: "Ayarlar kaydedildi." };
}
