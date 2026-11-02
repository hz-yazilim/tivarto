"use server";

import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";

export async function createCustomerAction(formData: FormData): Promise<void> {
  const { tenant } = await getTenantContext();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;
  await withTenant(tenant.id, async (tx) => {
    await tx.customer.create({
      data: {
        tenantId: tenant.id,
        name,
        phone: (formData.get("phone") as string) || undefined,
        email: (formData.get("email") as string) || undefined,
        address: (formData.get("address") as string) || undefined,
      },
    });
  });
}

export async function deleteCustomerAction(formData: FormData): Promise<void> {
  const { tenant } = await getTenantContext();
  const id = formData.get("id") as string;
  if (!id) return;
  await withTenant(tenant.id, async (tx) => {
    await tx.customer.deleteMany({ where: { id, tenantId: tenant.id } });
  });
}

export async function createSupplierAction(formData: FormData): Promise<void> {
  const { tenant } = await getTenantContext();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;
  await withTenant(tenant.id, async (tx) => {
    await tx.supplier.create({
      data: {
        tenantId: tenant.id,
        name,
        contactPerson: (formData.get("contactPerson") as string) || undefined,
        phone: (formData.get("phone") as string) || undefined,
        email: (formData.get("email") as string) || undefined,
        address: (formData.get("address") as string) || undefined,
      },
    });
  });
}

export async function deleteSupplierAction(formData: FormData): Promise<void> {
  const { tenant } = await getTenantContext();
  const id = formData.get("id") as string;
  if (!id) return;
  await withTenant(tenant.id, async (tx) => {
    await tx.supplier.deleteMany({ where: { id, tenantId: tenant.id } });
  });
}
