"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";
import { optionalStr, str, toInt } from "@/lib/validation";

export async function createStockMovementAction(
  formData: FormData
): Promise<void> {
  const { tenant, user } = await requireTenantContext();
  const productId = str(formData, "productId");
  const type = str(formData, "type");
  const quantity = toInt(str(formData, "quantity"), 0);
  const note = optionalStr(formData, "note");

  if (!productId) return;
  if (!["IN", "OUT", "ADJUST"].includes(type)) return;
  if (quantity <= 0) return;

  await withTenant(tenant.id, async (tx) => {
    const product = await tx.product.findFirst({
      where: { id: productId, tenantId: tenant.id },
      select: { id: true, stock: true },
    });
    if (!product) return;

    let newStock = product.stock;
    if (type === "IN") newStock += quantity;
    else if (type === "OUT") newStock = Math.max(0, product.stock - quantity);
    else newStock = quantity; // ADJUST: girilen miktar yeni stok olur

    await tx.stockMovement.create({
      data: {
        tenantId: tenant.id,
        productId,
        type: type as "IN" | "OUT" | "ADJUST",
        quantity,
        note,
        createdBy: user.id,
      },
    });

    await tx.product.update({
      where: { id: productId },
      data: { stock: newStock },
    });
  });

  revalidatePath("/panel/stock");
  redirect("/panel/stock");
}

export async function adjustStockAction(formData: FormData): Promise<void> {
  const { tenant, user } = await requireTenantContext();
  const productId = str(formData, "productId");
  const newStock = toInt(str(formData, "newStock"), -1);
  const note = optionalStr(formData, "note");
  if (!productId || newStock < 0) return;

  await withTenant(tenant.id, async (tx) => {
    const product = await tx.product.findFirst({
      where: { id: productId, tenantId: tenant.id },
      select: { id: true, stock: true },
    });
    if (!product) return;

    const diff = newStock - product.stock;
    if (diff === 0) return;

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
        note:
          note ??
          (diff > 0
            ? "Stok sayımı ile artırıldı"
            : "Stok sayımı ile azaltıldı"),
        createdBy: user.id,
      },
    });
  });

  revalidatePath("/panel/stock");
  redirect("/panel/stock");
}
