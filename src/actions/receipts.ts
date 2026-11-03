"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { GoodsReceiptStatus } from "@prisma/client";
import { requireTenantContext, requireWritableTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";
import { optionalStr, str, toInt, type FormState } from "@/lib/validation";

const RECEIPT_STATUSES: GoodsReceiptStatus[] = [
  "PENDING",
  "RECEIVED",
  "PARTIAL",
  "CANCELLED",
];

interface ParsedItem {
  productId: string;
  expectedQuantity: number;
  receivedQuantity: number;
  missingQuantity: number;
  damagedQuantity: number;
  note?: string;
}

export async function createGoodsReceiptAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { tenant, user } = await requireWritableTenantContext();

  const supplierId = optionalStr(formData, "supplierId") ?? null;
  const statusRaw = str(formData, "status") || "PENDING";
  if (!RECEIPT_STATUSES.includes(statusRaw as GoodsReceiptStatus) || statusRaw === "PENDING") {
    return { error: "Geçerli bir mal kabul durumu seçin. Bekleyen teslimatlar bu ekrandan kaydedilemez." };
  }
  const status = statusRaw as GoodsReceiptStatus;
  const note = optionalStr(formData, "note");

  let items: ParsedItem[];
  try {
    const parsed = JSON.parse(str(formData, "items") || "[]");
    if (!Array.isArray(parsed)) throw new Error("invalid");
    items = parsed;
  } catch {
    return { error: "Ürün listesi geçersiz." };
  }

  if (items.some((it) => !it || typeof it.productId !== "string" || !it.productId)) {
    return { error: "Ürün satırlarından biri geçersiz." };
  }
  if (items.length === 0) {
    return { error: "En az bir ürün ekleyin." };
  }
  if (items.length > 100) {
    return { error: "Tek seferde en fazla 100 satır ekleyebilirsiniz." };
  }

  for (const item of items) {
    const expected = Number(item.expectedQuantity);
    const received = Number(item.receivedQuantity);
    const missing = Number(item.missingQuantity);
    const damaged = Number(item.damagedQuantity);
    if (![expected, received, missing, damaged].every(Number.isSafeInteger) ||
        expected < 1 || received < 0 || missing < 0 || damaged < 0 || damaged > received) {
      return { error: "Miktarlar tam sayı olmalı; beklenen miktar en az 1 ve hasarlı miktar teslim alınandan fazla olamaz." };
    }
    if (status !== "CANCELLED" && received + missing !== expected) {
      return { error: "Beklenen miktar, teslim alınan ve eksik miktarların toplamına eşit olmalıdır." };
    }
    if (status === "RECEIVED" && missing > 0) {
      return { error: "Eksik ürün varsa durum olarak Kısmi Alındı seçin." };
    }
    if (status === "PARTIAL" && missing === 0) {
      return { error: "Eksik miktar yoksa durum olarak Tam Alındı seçin." };
    }
  }

  try {
    await withTenant(tenant.id, async (tx) => {
      if (supplierId) {
        const supplier = await tx.supplier.findFirst({
          where: { id: supplierId, tenantId: tenant.id },
          select: { id: true },
        });
        if (!supplier) throw new Error("Tedarikçi bulunamadı.");
      }

      const receipt = await tx.goodsReceipt.create({
        data: {
          tenantId: tenant.id,
          supplierId,
          status,
          note,
          receivedAt: status === "RECEIVED" || status === "PARTIAL" ? new Date() : null,
        },
      });

      for (const it of items) {
        const product = await tx.product.findFirst({
          where: { id: it.productId, tenantId: tenant.id },
          select: { id: true },
        });
        if (!product) throw new Error("Seçilen ürünlerden biri bu işletmede bulunamadı.");

        const receivedQuantity = Math.max(0, toInt(String(it.receivedQuantity ?? 0), 0));
        const expectedQuantity = Math.max(0, toInt(String(it.expectedQuantity ?? 0), 0));
        const missingQuantity = Math.max(0, toInt(String(it.missingQuantity ?? 0), 0));
        const damagedQuantity = Math.max(0, toInt(String(it.damagedQuantity ?? 0), 0));

        // Sadece sağlam teslim alınan ürünler stoğa girer.
        // Beklemede ve iptal durumundaki teslimatlar stoğa işlenmez.
        const stockable =
          status === "RECEIVED" || status === "PARTIAL"
            ? Math.max(0, receivedQuantity - damagedQuantity)
            : 0;

        await tx.goodsReceiptItem.create({
          data: {
            tenantId: tenant.id,
            receiptId: receipt.id,
            productId: it.productId,
            expectedQuantity,
            receivedQuantity,
            missingQuantity,
            damagedQuantity,
            note: it.note || undefined,
          },
        });

        if (stockable > 0) {
          await tx.stockMovement.create({
            data: {
              tenantId: tenant.id,
              productId: it.productId,
              type: "IN",
              quantity: stockable,
              note: `Mal kabul: ${receipt.id}`,
              createdBy: user.id,
            },
          });
          await tx.product.update({
            where: { id: it.productId },
            data: { stock: { increment: stockable } },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          action: "goodsReceipt.create",
          entity: "GoodsReceipt",
          entityId: receipt.id,
        },
      });
    });
  } catch (error) {
    console.error("goodsReceipt error", error);
    return {
      error:
        error instanceof Error ? error.message : "Mal kabul kaydı oluşturulamadı.",
    };
  }

  revalidatePath("/panel/receipts");
  revalidatePath("/panel/stock");
  redirect("/panel/receipts");
}

export async function listGoodsReceipts(tenantId: string) {
  const { tenant } = await requireTenantContext();
  if (tenant.id !== tenantId) throw new Error("Bu işletmenin mal kabul kayıtlarına erişemezsiniz.");
  return withTenant(tenant.id, async (tx) => {
    return tx.goodsReceipt.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { supplier: true, items: true },
    });
  });
}
