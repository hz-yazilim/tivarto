"use server";

import { revalidatePath } from "next/cache";
import { requireTenantContext, requireWritableTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";
import { optionalStr, str, type FormState } from "@/lib/validation";

export async function getSettingsAction() {
  const { tenant } = await requireTenantContext();
  return withTenant(tenant.id, async (tx) => {
    return tx.storeSettings.findUnique({ where: { tenantId: tenant.id } });
  });
}

export async function updateSettingsAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { tenant, user } = await requireWritableTenantContext();

  const theme = str(formData, "theme") || "default";
  if (!["default", "modern", "minimal"].includes(theme)) {
    return { error: "Geçersiz tema." };
  }
  const mapsUrl = optionalStr(formData, "mapsUrl");
  if (mapsUrl) {
    try {
      const parsed = new URL(mapsUrl);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return { error: "Harita bağlantısı http:// veya https:// ile başlamalıdır." };
      }
    } catch {
      return { error: "Geçerli bir harita bağlantısı girin." };
    }
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
      mapsUrl: mapsUrl ?? null,
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
