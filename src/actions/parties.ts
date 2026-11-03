"use server";

import { revalidatePath } from "next/cache";
import { requireWritableTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";
import { optionalStr, str } from "@/lib/validation";

// ---------- Müşteriler ----------

export async function createCustomerAction(formData: FormData): Promise<void> {
  const { tenant } = await requireWritableTenantContext();
  const name = str(formData, "name");
  if (!name) return;

  await withTenant(tenant.id, async (tx) => {
    await tx.customer.create({
      data: {
        tenantId: tenant.id,
        name,
        phone: optionalStr(formData, "phone"),
        email: optionalStr(formData, "email"),
        address: optionalStr(formData, "address"),
      },
    });
  });

  revalidatePath("/panel/customers");
}

export async function deleteCustomerAction(formData: FormData): Promise<void> {
  const { tenant } = await requireWritableTenantContext();
  const id = str(formData, "id");
  if (!id) return;

  await withTenant(tenant.id, async (tx) => {
    // Siparişi olan müşteri silinmez; siparişlerin müşteri bağlantısı kopar.
    await tx.order.updateMany({
      where: { customerId: id, tenantId: tenant.id },
      data: { customerId: null },
    });
    await tx.customer.deleteMany({ where: { id, tenantId: tenant.id } });
  });

  revalidatePath("/panel/customers");
}

// ---------- Tedarikçiler ----------

export async function createSupplierAction(formData: FormData): Promise<void> {
  const { tenant } = await requireWritableTenantContext();
  const name = str(formData, "name");
  if (!name) return;

  await withTenant(tenant.id, async (tx) => {
    await tx.supplier.create({
      data: {
        tenantId: tenant.id,
        name,
        contactPerson: optionalStr(formData, "contactPerson"),
        phone: optionalStr(formData, "phone"),
        email: optionalStr(formData, "email"),
        address: optionalStr(formData, "address"),
      },
    });
  });

  revalidatePath("/panel/suppliers");
}

export async function deleteSupplierAction(formData: FormData): Promise<void> {
  const { tenant } = await requireWritableTenantContext();
  const id = str(formData, "id");
  if (!id) return;

  await withTenant(tenant.id, async (tx) => {
    await tx.goodsReceipt.updateMany({
      where: { supplierId: id, tenantId: tenant.id },
      data: { supplierId: null },
    });
    await tx.supplier.deleteMany({ where: { id, tenantId: tenant.id } });
  });

  revalidatePath("/panel/suppliers");
}
