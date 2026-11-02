"use server";

import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";

export async function updateOrderStatusAction(formData: FormData): Promise<void> {
  const { tenant } = await getTenantContext();
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  if (!id || !status) return;

  await withTenant(tenant.id, async (tx) => {
    const order = await tx.order.findFirst({
      where: { id, tenantId: tenant.id },
    });
    if (!order) return;
    await tx.order.update({
      where: { id },
      data: { status: status as any },
    });
  });

  redirect("/panel/orders");
}

export async function listOrders(tenantId: string) {
  return withTenant(tenantId, async (tx) => {
    return tx.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: { include: { product: true } } },
    });
  });
}

export async function getOrder(tenantId: string, id: string) {
  return withTenant(tenantId, async (tx) => {
    return tx.order.findFirst({
      where: { id, tenantId: tenantId },
      include: { items: { include: { product: true } } },
    });
  });
}
