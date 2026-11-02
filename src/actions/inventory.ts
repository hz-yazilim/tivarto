"use server";

import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";

function toInt(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const v = parseInt(s, 10);
  return Number.isNaN(v) ? undefined : v;
}

export async function createStockMovementAction(formData: FormData): Promise<void> {
  const { tenant } = await getTenantContext();
  const productId = formData.get("productId") as string;
  const type = formData.get("type") as string;
  const quantity = toInt(formData.get("quantity") as string);
  const note = (formData.get("note") as string) || undefined;

  if (!productId || !type || !quantity || quantity <= 0) return;

  await withTenant(tenant.id, async (tx) => {
    const product = await tx.product.findFirst({
      where: { id: productId, tenantId: tenant.id },
    });
    if (!product) return;

    let stockDelta = 0;
    if (type === "IN") stockDelta = quantity;
    else if (type === "OUT") stockDelta = -quantity;

    await tx.stockMovement.create({
      data: {
        tenantId: tenant.id,
        productId,
        type: type as any,
        quantity,
        note,
        createdBy: "current-user",
      },
    });

    if (type !== "ADJUST") {
      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: stockDelta } },
      });
    }
  });

  redirect("/panel/stock");
}

export async function adjustStockAction(formData: FormData): Promise<void> {
  const { tenant } = await getTenantContext();
  const productId = formData.get("productId") as string;
  const newStock = toInt(formData.get("newStock") as string);
  const note = (formData.get("note") as string) || undefined;
  if (!productId || newStock === undefined || newStock < 0) return;

  await withTenant(tenant.id, async (tx) => {
    const product = await tx.product.findFirst({
      where: { id: productId, tenantId: tenant.id },
    });
    if (!product) return;

    const diff = newStock - product.stock;
    await tx.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });
    await tx.stockMovement.create({
      data: {
        tenantId: tenant.id,
        productId,
        type: "ADJUST",
        quantity: Math.abs(diff),
        note: note || (diff >= 0 ? "Stok sayımı ile artırıldı" : "Stok sayımı ile azaltıldı"),
        createdBy: "current-user",
      },
    });
  });

  redirect("/panel/stock");
}
