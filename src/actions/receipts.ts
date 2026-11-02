"use server";

import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";

function toInt(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const v = parseInt(s, 10);
  return Number.isNaN(v) ? undefined : v;
}

export async function createGoodsReceiptAction(
  prevState: any,
  formData: FormData
) {
  const { tenant } = await getTenantContext();
  const supplierId = (formData.get("supplierId") as string) || undefined;
  const status = (formData.get("status") as string) || "PENDING";
  const note = (formData.get("note") as string) || undefined;
  const itemsRaw = (formData.get("items") as string) || "[]";

  let items: any[];
  try {
    items = JSON.parse(itemsRaw);
  } catch {
    return { error: "Ürün listesi geçersiz." };
  }
  if (!items.length) return { error: "En fazla bir ürün ekleyin." };

  await withTenant(tenant.id, async (tx) => {
    const receipt = await tx.goodsReceipt.create({
      data: {
        tenantId: tenant.id,
        supplierId,
        status: status as any,
        note,
      },
    });

    for (const it of items) {
      const productId = it.productId as string;
      const receivedQuantity = toInt(it.receivedQuantity as string) || 0;
      const product = await tx.product.findFirst({
        where: { id: productId, tenantId: tenant.id },
      });
      if (!product) continue;

      await tx.goodsReceiptItem.create({
        data: {
          tenantId: tenant.id,
          receiptId: receipt.id,
          productId,
          expectedQuantity: toInt(it.expectedQuantity as string) || 0,
          receivedQuantity,
          missingQuantity: toInt(it.missingQuantity as string) || 0,
          damagedQuantity: toInt(it.damagedQuantity as string) || 0,
          note: it.note || undefined,
        },
      });

      if (receivedQuantity > 0) {
        await tx.stockMovement.create({
          data: {
            tenantId: tenant.id,
            productId,
            type: "IN",
            quantity: receivedQuantity,
            note: `Mal kabul: ${receipt.id}`,
            createdBy: "current-user",
          },
        });
        await tx.product.update({
          where: { id: productId },
          data: { stock: { increment: receivedQuantity } },
        });
      }
    }

    if (status === "RECEIVED") {
      await tx.goodsReceipt.update({
        where: { id: receipt.id },
        data: { receivedAt: new Date() },
      });
    }
  });

  redirect("/panel/receipts");
}

export async function listGoodsReceipts(tenantId: string) {
  return withTenant(tenantId, async (tx) => {
    return tx.goodsReceipt.findMany({
      orderBy: { createdAt: "desc" },
      include: { supplier: true, items: { include: { product: true } } },
    });
  });
}
