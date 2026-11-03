"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { requireWritableTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";
import { str } from "@/lib/validation";

const STATUSES: OrderStatus[] = [
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "COMPLETED",
  "CANCELLED",
];

export async function updateOrderStatusAction(formData: FormData): Promise<void> {
  const { tenant, user } = await requireWritableTenantContext();
  const id = str(formData, "id");
  const status = str(formData, "status") as OrderStatus;
  if (!id || !STATUSES.includes(status)) return;

  await withTenant(tenant.id, async (tx) => {
    const order = await tx.order.findFirst({
      where: { id, tenantId: tenant.id },
      select: { id: true, status: true },
    });
    if (!order || order.status === status) return;

    // Tamamlanan veya iptal edilen siparişler terminal durumdur.
    const allowed: Record<OrderStatus, OrderStatus[]> = {
      NEW: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["PREPARING", "CANCELLED"],
      PREPARING: ["COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
    };
    if (!allowed[order.status].includes(status)) return;

    // Durumu önce koşullu değiştir: eşzamanlı iki iptal stoğu iki kez iade edemez.
    const changed = await tx.order.updateMany({
      where: { id, tenantId: tenant.id, status: order.status },
      data: { status },
    });
    if (changed.count !== 1) return;

    // Sipariş ilk kez iptal edildiğinde stok yalnızca bir kez geri eklenir.
    if (status === "CANCELLED") {
      const items = await tx.orderItem.findMany({
        where: { orderId: id, tenantId: tenant.id },
        select: { productId: true, quantity: true },
      });
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            tenantId: tenant.id,
            productId: item.productId,
            type: "IN",
            quantity: item.quantity,
            note: `Sipariş iptali: ${id}`,
            createdBy: user.id,
          },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        action: `order.status.${status.toLowerCase()}`,
        entity: "Order",
        entityId: id,
      },
    });
  });

  revalidatePath("/panel/orders");
  revalidatePath("/panel");
  redirect("/panel/orders");
}

export async function listOrders(tenantId: string) {
  const { tenant } = await requireTenantContext();
  if (tenant.id !== tenantId) throw new Error("Bu işletmenin siparişlerine erişemezsiniz.");
  return withTenant(tenant.id, async (tx) => {
    return tx.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { items: true },
    });
  });
}

export async function getOrder(tenantId: string, id: string) {
  const { tenant } = await requireTenantContext();
  if (tenant.id !== tenantId) throw new Error("Bu işletmenin siparişlerine erişemezsiniz.");
  return withTenant(tenant.id, async (tx) => {
    return tx.order.findFirst({
      where: { id, tenantId },
      include: { items: { include: { product: true } } },
    });
  });
}
