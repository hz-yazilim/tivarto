"use server";

import { withTenant } from "@/lib/db";
import { prisma } from "@/lib/auth";

export async function createStorefrontOrderAction(
  tenantId: string,
  prevState: any,
  formData: FormData
) {
  const customerName = (formData.get("customerName") as string)?.trim();
  const customerPhone = (formData.get("customerPhone") as string)?.trim();
  const customerAddress = (formData.get("customerAddress") as string)?.trim() || undefined;
  const note = (formData.get("note") as string)?.trim() || undefined;
  const itemsRaw = (formData.get("items") as string) || "[]";

  if (!customerName || !customerPhone) {
    return { error: "Ad soyad ve telefon zorunludur." };
  }

  let items: { productId: string; quantity: number }[];
  try {
    items = JSON.parse(itemsRaw);
  } catch {
    return { error: "Sepet geçersiz." };
  }
  if (!items.length) return { error: "En fazla bir ürün ekleyin." };

  let total = 0;
  const validated: {
    productId: string;
    quantity: number;
    unitPrice: number;
    name: string;
  }[] = [];

  await withTenant(tenantId, async (tx) => {
    for (const it of items) {
      const product = await tx.product.findFirst({
        where: { id: it.productId, tenantId },
      });
      if (!product || !product.isActive) continue;
      const lineTotal = Number(product.sellPrice) * it.quantity;
      total += lineTotal;
      validated.push({
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: Number(product.sellPrice),
        name: product.name,
      });
    }

    const order = await tx.order.create({
      data: {
        tenantId,
        customerName,
        customerPhone,
        customerAddress,
        note,
        total,
        status: "NEW",
      },
    });

    for (const it of validated) {
      await tx.orderItem.create({
        data: {
          tenantId,
          orderId: order.id,
          productId: it.productId,
          name: it.name,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
        },
      });
      await tx.stockMovement.create({
        data: {
          tenantId,
          productId: it.productId,
          type: "OUT",
          quantity: it.quantity,
          note: `Sipariş: ${order.id}`,
          createdBy: "storefront",
        },
      });
      await tx.product.update({
        where: { id: it.productId },
        data: { stock: { decrement: it.quantity } },
      });
    }
  });

  const whatsappMessage = encodeURIComponent(
    `Merhaba, Tivarto mağazanızdan sipariş vermek istiyorum.\n\nAd: ${customerName}\nTelefon: ${customerPhone}\n${
      customerAddress ? "Adres: " + customerAddress + "\n" : ""
    }Not: ${note || "-"}\n\nÜrünler:\n${
      validated.map((v) => `- ${v.quantity} adet`).join("\n")
    }\nToplam: ${total.toLocaleString("tr-TR")} TL`
  );

  return { ok: true, whatsappUrl: `https://wa.me/?text=${whatsappMessage}`, orderTotal: total };
}
