"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireWritableTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";
import { optionalStr, str, toInt } from "@/lib/validation";

export async function createStockMovementAction(
  formData: FormData
): Promise<void> {
  const { tenant, user } = await requireWritableTenantContext();
  const productId = str(formData, "productId");
  const type = str(formData, "type");
  const quantity = toInt(str(formData, "quantity"), 0);
  const note = optionalStr(formData, "note");

  if (!productId) return;
  if (!["IN", "OUT", "ADJUST"].includes(type)) return;
  if (quantity <= 0) return;

  const result = await withTenant(tenant.id, async (tx) => {
    const product = await tx.product.findFirst({
      where: { id: productId, tenantId: tenant.id },
      select: { id: true, stock: true },
    });
    if (!product) return "Ürün bulunamadı.";

    if (type === "OUT") {
      // Koşullu güncelleme eşzamanlı satışlarda da stoğun negatife düşmesini önler.
      const updated = await tx.product.updateMany({
        where: { id: productId, tenantId: tenant.id, stock: { gte: quantity } },
        data: { stock: { decrement: quantity } },
      });
      if (updated.count !== 1) return "Yeterli stok bulunmuyor. Stok miktarını yenileyip tekrar deneyin.";
    } else if (type === "IN") {
      await tx.product.update({
        where: { id: productId },
        data: { stock: { increment: quantity } },
      });
    } else {
      await tx.product.update({
        where: { id: productId },
        data: { stock: quantity },
      });
    }

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
    return null;
  });
  if (result) redirect(`/panel/stock?error=${encodeURIComponent(result)}`);

  revalidatePath("/panel/stock");
  redirect("/panel/stock");
}

export async function adjustStockAction(formData: FormData): Promise<void> {
  const { tenant, user } = await requireWritableTenantContext();
  const productId = str(formData, "productId");
  const newStock = toInt(str(formData, "newStock"), -1);
  const note = optionalStr(formData, "note");
  if (!productId || newStock < 0) return;

  const result = await withTenant(tenant.id, async (tx) => {
    const product = await tx.product.findFirst({
      where: { id: productId, tenantId: tenant.id },
      select: { id: true, stock: true },
    });
    if (!product) return "Ürün bulunamadı.";

    const diff = newStock - product.stock;
    if (diff === 0) return null;

    // Eski stok değeri koşula eklenir; eşzamanlı satış/sayım birbirini ezmez.
    const updated = await tx.product.updateMany({
      where: { id: productId, tenantId: tenant.id, stock: product.stock },
      data: { stock: newStock },
    });
    if (updated.count !== 1) return "Stok aynı anda başka bir işlemle değişti. Sayfayı yenileyip tekrar deneyin.";

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
    return null;
  });
  if (result) redirect(`/panel/stock?error=${encodeURIComponent(result)}`);

  revalidatePath("/panel/stock");
  redirect("/panel/stock");
}
