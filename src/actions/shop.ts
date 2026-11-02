"use server";

import { revalidatePath } from "next/cache";
import { prisma, withTenant } from "@/lib/db";
import {
  isValidPhone,
  optionalStr,
  str,
  toInt,
  type FormState,
} from "@/lib/validation";

interface CartLine {
  productId: string;
  quantity: number;
}

/**
 * Mağaza vitrininden (herkese açık) gelen sipariş.
 * Fiyatlar ASLA istemciden alınmaz; sunucuda ürün kaydından okunur.
 */
export async function createStorefrontOrderAction(
  tenantId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const customerName = str(formData, "customerName");
  const customerPhone = str(formData, "customerPhone");
  const customerAddress = optionalStr(formData, "customerAddress");
  const note = optionalStr(formData, "note");

  if (!customerName || customerName.length < 3) {
    return { error: "Ad soyad en az 3 karakter olmalıdır." };
  }
  if (!customerPhone || !isValidPhone(customerPhone)) {
    return { error: "Geçerli bir telefon numarası girin." };
  }

  let cart: CartLine[];
  try {
    const parsed = JSON.parse(str(formData, "items") || "[]");
    if (!Array.isArray(parsed)) throw new Error("invalid");
    cart = parsed;
  } catch {
    return { error: "Sepet geçersiz." };
  }

  cart = cart
    .filter(
      (line) =>
        line &&
        typeof line.productId === "string" &&
        Number.isFinite(Number(line.quantity)) &&
        Number(line.quantity) > 0
    )
    .map((line) => ({
      productId: line.productId,
      quantity: Math.min(999, toInt(String(line.quantity), 1)),
    }));

  if (cart.length === 0) {
    return { error: "Sepetinize en az bir ürün ekleyin." };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, slug: true, status: true, name: true, storeSettings: true },
  });
  if (!tenant || tenant.status !== "ACTIVE") {
    return { error: "Mağaza şu anda sipariş kabul etmiyor." };
  }

  let orderId = "";
  let total = 0;
  const lines: { name: string; quantity: number; lineTotal: number }[] = [];

  try {
    await withTenant(tenant.id, async (tx) => {
      const products = await tx.product.findMany({
        where: {
          id: { in: cart.map((l) => l.productId) },
          tenantId: tenant.id,
          isActive: true,
        },
        select: { id: true, name: true, sellPrice: true, stock: true },
      });

      const byId = new Map(products.map((p) => [p.id, p]));

      for (const line of cart) {
        const product = byId.get(line.productId);
        if (!product) continue;
        if (product.stock < line.quantity) {
          throw new Error(
            `"${product.name}" için yeterli stok yok (kalan: ${product.stock}).`
          );
        }
        const unitPrice = Number(product.sellPrice);
        total += unitPrice * line.quantity;
        lines.push({
          name: product.name,
          quantity: line.quantity,
          lineTotal: unitPrice * line.quantity,
        });
      }

      if (lines.length === 0) {
        throw new Error("Seçilen ürünler artık satışta değil.");
      }

      // Aynı telefonla daha önce sipariş verdiyse müşteri kartına bağla.
      let customerId: string | null = null;
      const existing = await tx.customer.findFirst({
        where: { tenantId: tenant.id, phone: customerPhone },
        select: { id: true },
      });
      if (existing) {
        customerId = existing.id;
        await tx.customer.update({
          where: { id: existing.id },
          data: {
            name: customerName,
            address: customerAddress ?? undefined,
          },
        });
      } else {
        const created = await tx.customer.create({
          data: {
            tenantId: tenant.id,
            name: customerName,
            phone: customerPhone,
            address: customerAddress,
          },
        });
        customerId = created.id;
      }

      const order = await tx.order.create({
        data: {
          tenantId: tenant.id,
          customerId,
          customerName,
          customerPhone,
          customerAddress,
          note,
          total,
          status: "NEW",
        },
      });
      orderId = order.id;

      for (const line of cart) {
        const product = byId.get(line.productId);
        if (!product) continue;

        await tx.orderItem.create({
          data: {
            tenantId: tenant.id,
            orderId: order.id,
            productId: product.id,
            name: product.name,
            unitPrice: Number(product.sellPrice),
            quantity: line.quantity,
          },
        });

        await tx.stockMovement.create({
          data: {
            tenantId: tenant.id,
            productId: product.id,
            type: "OUT",
            quantity: line.quantity,
            note: `Vitrin siparişi: ${order.id}`,
            createdBy: "storefront",
          },
        });

        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: line.quantity } },
        });
      }

      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          action: "order.create.storefront",
          entity: "Order",
          entityId: order.id,
        },
      });
    });
  } catch (error) {
    console.error("storefront order error", error);
    return {
      error:
        error instanceof Error ? error.message : "Sipariş oluşturulamadı.",
    };
  }

  revalidatePath(`/shop/${tenant.slug}`);
  revalidatePath("/panel/orders");
  revalidatePath("/panel");

  const whatsappNumber = (tenant.storeSettings?.whatsapp ?? "").replace(/\D/g, "");
  const summary = [
    `Merhaba ${tenant.name},`,
    "",
    `Sipariş No: #${orderId.slice(-6)}`,
    `Ad: ${customerName}`,
    `Telefon: ${customerPhone}`,
    customerAddress ? `Adres: ${customerAddress}` : null,
    note ? `Not: ${note}` : null,
    "",
    "Ürünler:",
    ...lines.map(
      (l) =>
        `- ${l.name} × ${l.quantity} = ${l.lineTotal.toLocaleString("tr-TR")} TL`
    ),
    "",
    `Toplam: ${total.toLocaleString("tr-TR")} TL`,
  ]
    .filter(Boolean)
    .join("\n");

  const whatsappUrl = `https://wa.me/${whatsappNumber || "90"}?text=${encodeURIComponent(
    summary
  )}`;

  return {
    ok: true,
    message: `Siparişiniz alındı. Toplam: ${total.toLocaleString("tr-TR")} TL`,
    whatsappUrl,
  };
}
