"use server";

import { revalidatePath } from "next/cache";
import { prisma, withTenant } from "@/lib/db";
import {
  isValidPhone,
  normalizeWhatsAppNumber,
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

  // Aynı ürün sepet payload'ında birden fazla kez gelirse miktarları birleştir.
  const merged = new Map<string, number>();
  for (const line of cart) {
    if (!line || typeof line.productId !== "string" || !line.productId) continue;
    const quantity = Number(line.quantity);
    if (!Number.isSafeInteger(quantity) || quantity <= 0) continue;
    merged.set(line.productId, (merged.get(line.productId) ?? 0) + quantity);
  }
  cart = Array.from(merged, ([productId, quantity]) => ({ productId, quantity }));
  if (cart.some((line) => line.quantity > 999)) {
    return { error: "Bir üründen tek siparişte en fazla 999 adet seçebilirsiniz." };
  }

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
  const maintenance = await prisma.featureFlag.findUnique({ where: { key: "maintenance_mode" }, select: { enabled: true } });
  if (maintenance?.enabled) {
    return { error: "Tivarto şu anda bakımda. Lütfen daha sonra tekrar deneyin." };
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

        // Atomik koşullu düşüm: eşzamanlı siparişlerde negatif stok oluşmasını engeller.
        const deducted = await tx.product.updateMany({
          where: {
            id: product.id,
            tenantId: tenant.id,
            isActive: true,
            stock: { gte: line.quantity },
          },
          data: { stock: { decrement: line.quantity } },
        });
        if (deducted.count !== 1) {
          throw new Error(`"${product.name}" için yeterli stok kalmadı. Sepetinizi yenileyip tekrar deneyin.`);
        }
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

  const whatsappNumber = normalizeWhatsAppNumber(tenant.storeSettings?.whatsapp ?? "");
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

  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(summary)}`
    : undefined;

  return {
    ok: true,
    message: `Siparişiniz alındı. Toplam: ${total.toLocaleString("tr-TR")} TL`,
    whatsappUrl,
  };
}
