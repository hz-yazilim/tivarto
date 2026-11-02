"use server";

import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";
import { prisma } from "@/lib/auth";

function toDecimal(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const v = parseFloat(s.replace(",", "."));
  return Number.isNaN(v) ? undefined : v;
}

function toInt(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const v = parseInt(s, 10);
  return Number.isNaN(v) ? undefined : v;
}

// ---------- Products (useActionState) ----------

export async function createProductAction(prevState: any, formData: FormData) {
  const { tenant } = await getTenantContext();

  const name = (formData.get("name") as string)?.trim();
  const sellPriceRaw = (formData.get("sellPrice") as string)?.trim();
  if (!name || !sellPriceRaw) {
    return { error: "Ürün adı ve satış fiyatı zorunludur." };
  }
  const sellPrice = toDecimal(sellPriceRaw);
  if (sellPrice === undefined) {
    return { error: "Geçersiz satış fiyatı." };
  }

  await withTenant(tenant.id, async (tx) => {
    await tx.product.create({
      data: {
        tenantId: tenant.id,
        categoryId: (formData.get("categoryId") as string) || undefined,
        name,
        description: (formData.get("description") as string) || undefined,
        imageUrl: (formData.get("imageUrl") as string) || undefined,
        barcode: (formData.get("barcode") as string) || undefined,
        sku: (formData.get("sku") as string) || undefined,
        buyPrice: toDecimal((formData.get("buyPrice") as string) ?? undefined),
        sellPrice,
        stock: toInt((formData.get("stock") as string) ?? "0") ?? 0,
        minStock: toInt((formData.get("minStock") as string) ?? "0") ?? 0,
        isActive: formData.get("isActive") === "on",
      },
    });
  });

  redirect("/panel/products");
}

export async function updateProductAction(prevState: any, formData: FormData) {
  const { tenant } = await getTenantContext();
  const id = formData.get("id") as string;
  if (!id) return { error: "Ürün bulunamadı." };

  const name = (formData.get("name") as string)?.trim();
  const sellPriceRaw = (formData.get("sellPrice") as string)?.trim();
  if (!name || !sellPriceRaw) {
    return { error: "Ürün adı ve satış fiyatı zorunludur." };
  }
  const sellPrice = toDecimal(sellPriceRaw);
  if (sellPrice === undefined) {
    return { error: "Geçersiz satış fiyatı." };
  }

  await withTenant(tenant.id, async (tx) => {
    const product = await tx.product.findFirst({
      where: { id, tenantId: tenant.id },
    });
    if (!product) return { error: "Ürün bulunamadı." };

    await tx.product.update({
      where: { id },
      data: {
        categoryId: (formData.get("categoryId") as string) || undefined,
        name,
        description: (formData.get("description") as string) || undefined,
        imageUrl: (formData.get("imageUrl") as string) || undefined,
        barcode: (formData.get("barcode") as string) || undefined,
        sku: (formData.get("sku") as string) || undefined,
        buyPrice: toDecimal((formData.get("buyPrice") as string) ?? undefined),
        sellPrice,
        stock: toInt((formData.get("stock") as string) ?? "0") ?? 0,
        minStock: toInt((formData.get("minStock") as string) ?? "0") ?? 0,
        isActive: formData.get("isActive") === "on",
      },
    });
  });

  redirect("/panel/products");
}

// ---------- Products (direct form) ----------

export async function deleteProductAction(formData: FormData): Promise<void> {
  const { tenant } = await getTenantContext();
  const id = formData.get("id") as string;
  if (!id) return;
  await withTenant(tenant.id, async (tx) => {
    await tx.product.deleteMany({ where: { id, tenantId: tenant.id } });
  });
}

export async function toggleProductAction(formData: FormData): Promise<void> {
  const { tenant } = await getTenantContext();
  const id = formData.get("id") as string;
  const active = formData.get("isActive") === "true";
  if (!id) return;
  await withTenant(tenant.id, async (tx) => {
    await tx.product.update({
      where: { id, tenantId: tenant.id },
      data: { isActive: active },
    });
  });
}

// ---------- Categories (direct form) ----------

export async function createCategoryAction(formData: FormData): Promise<void> {
  const { tenant } = await getTenantContext();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;
  await withTenant(tenant.id, async (tx) => {
    await tx.category.create({
      data: {
        tenantId: tenant.id,
        name,
        sortOrder: toInt((formData.get("sortOrder") as string) ?? "0") ?? 0,
      },
    });
  });
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const { tenant } = await getTenantContext();
  const id = formData.get("id") as string;
  if (!id) return;
  await withTenant(tenant.id, async (tx) => {
    await tx.category.deleteMany({ where: { id, tenantId: tenant.id } });
  });
}
