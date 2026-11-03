"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireWritableTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";
import { optionalStr, str, toInt, toNumber, type FormState } from "@/lib/validation";

// ---------- Ürünler ----------

/**
 * Checkbox semantiği: işaretliyse "on"/"true", değilse alan hiç gönderilmez.
 * Düzenleme formu ayrıca gizli `isActive` alanı gönderebilir; bu yüzden
 * "alan yok" durumu "pasif" kabul edilir (açıkça belirtilmediyse yayınlanmaz).
 */
function readIsActive(formData: FormData): boolean {
  const value = str(formData, "isActive").toLowerCase();
  return value === "on" || value === "true" || value === "1";
}

export async function createProductAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { tenant, user } = await requireWritableTenantContext();

  const name = str(formData, "name");
  const sellPrice = toNumber(str(formData, "sellPrice"));
  if (!name) return { error: "Ürün adı zorunludur." };
  if (sellPrice === undefined || sellPrice < 0) return { error: "Sıfır veya daha yüksek geçerli bir satış fiyatı girin." };
  const buyPrice = toNumber(str(formData, "buyPrice"));
  if (buyPrice !== undefined && buyPrice < 0) return { error: "Alış fiyatı negatif olamaz." };

  const categoryId = optionalStr(formData, "categoryId") ?? null;
  if (categoryId) {
    const categoryExists = await withTenant(tenant.id, (tx) =>
      tx.category.findFirst({ where: { id: categoryId, tenantId: tenant.id }, select: { id: true } })
    );
    if (!categoryExists) return { error: "Seçilen kategori bu işletmede bulunamadı." };
  }
  const imageUrl = optionalStr(formData, "imageUrl");
  if (imageUrl && !imageUrl.startsWith("/uploads/")) {
    try {
      const parsed = new URL(imageUrl);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return { error: "Görsel bağlantısı http:// veya https:// olmalıdır." };
    } catch {
      return { error: "Geçerli bir görsel bağlantısı girin." };
    }
  }

  const stock = Math.max(0, toInt(str(formData, "stock"), 0));

  const created = await withTenant(tenant.id, async (tx) => {
    const [productCount, plan] = await Promise.all([
      tx.product.count({ where: { tenantId: tenant.id } }),
      tx.plan.findUnique({ where: { id: tenant.planId }, select: { maxProducts: true, name: true } }),
    ]);
    if (plan && productCount >= plan.maxProducts) return false;

    const product = await tx.product.create({
      data: {
        tenantId: tenant.id,
        categoryId,
        name,
        description: optionalStr(formData, "description"),
        imageUrl,
        barcode: optionalStr(formData, "barcode"),
        sku: optionalStr(formData, "sku"),
        buyPrice: buyPrice ?? null,
        sellPrice,
        stock,
        minStock: Math.max(0, toInt(str(formData, "minStock"), 0)),
        isActive: readIsActive(formData),
      },
    });

    // Açılış stoğu varsa hareket kaydı da oluştur.
    if (stock > 0) {
      await tx.stockMovement.create({
        data: {
          tenantId: tenant.id,
          productId: product.id,
          type: "IN",
          quantity: stock,
          note: "Ürün oluşturulurken girilen açılış stoğu",
          createdBy: user.id,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        action: "product.create",
        entity: "Product",
        entityId: product.id,
      },
    });
    return true;
  });

  if (!created) {
    return { error: "Paketinizdeki ürün limitine ulaştınız. Daha fazla ürün eklemek için planınızı yükseltin." };
  }

  revalidatePath("/panel/products");
  redirect("/panel/products");
}

export async function updateProductAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const { tenant, user } = await requireWritableTenantContext();
  const id = str(formData, "id");
  if (!id) return { error: "Ürün bulunamadı." };

  const name = str(formData, "name");
  const sellPrice = toNumber(str(formData, "sellPrice"));
  if (!name) return { error: "Ürün adı zorunludur." };
  if (sellPrice === undefined || sellPrice < 0) return { error: "Sıfır veya daha yüksek geçerli bir satış fiyatı girin." };
  const buyPrice = toNumber(str(formData, "buyPrice"));
  if (buyPrice !== undefined && buyPrice < 0) return { error: "Alış fiyatı negatif olamaz." };
  const categoryId = formData.has("categoryId") ? (optionalStr(formData, "categoryId") ?? null) : undefined;
  if (categoryId) {
    const categoryExists = await withTenant(tenant.id, (tx) =>
      tx.category.findFirst({ where: { id: categoryId, tenantId: tenant.id }, select: { id: true } })
    );
    if (!categoryExists) return { error: "Seçilen kategori bu işletmede bulunamadı." };
  }
  const imageUrl = optionalStr(formData, "imageUrl");
  if (imageUrl && !imageUrl.startsWith("/uploads/")) {
    try {
      const parsed = new URL(imageUrl);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return { error: "Görsel bağlantısı http:// veya https:// olmalıdır." };
    } catch {
      return { error: "Geçerli bir görsel bağlantısı girin." };
    }
  }

  const missing = await withTenant(tenant.id, async (tx) => {
    const product = await tx.product.findFirst({
      where: { id, tenantId: tenant.id },
      select: { id: true },
    });
    if (!product) return true;

    await tx.product.updateMany({
      where: { id, tenantId: tenant.id },
      data: {
        // Boş seçim ("") kategoriyi kaldırır; alan hiç gönderilmediyse korunur.
        categoryId,
        name,
        description: optionalStr(formData, "description") ?? null,
        imageUrl: imageUrl ?? null,
        barcode: optionalStr(formData, "barcode") ?? null,
        sku: optionalStr(formData, "sku") ?? null,
        buyPrice: buyPrice ?? null,
        sellPrice,
        minStock: Math.max(0, toInt(str(formData, "minStock"), 0)),
        isActive: readIsActive(formData),
      },
    });

    await tx.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        action: "product.update",
        entity: "Product",
        entityId: id,
      },
    });
    return false;
  });

  if (missing) return { error: "Ürün bulunamadı." };

  revalidatePath("/panel/products");
  redirect("/panel/products");
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const { tenant, user } = await requireWritableTenantContext();
  const id = str(formData, "id");
  if (!id) return;

  await withTenant(tenant.id, async (tx) => {
    const product = await tx.product.findFirst({
      where: { id, tenantId: tenant.id },
      select: { id: true, name: true, isActive: true },
    });
    if (!product) return;

    // Geçmiş sipariş, mal kabul veya stok hareketi varsa kayıtları koru.
    const [orderUsage, receiptUsage, movementUsage] = await Promise.all([
      tx.orderItem.count({ where: { productId: id, tenantId: tenant.id } }),
      tx.goodsReceiptItem.count({ where: { productId: id, tenantId: tenant.id } }),
      tx.stockMovement.count({ where: { productId: id, tenantId: tenant.id } }),
    ]);
    const hasHistory = orderUsage > 0 || receiptUsage > 0 || movementUsage > 0;

    if (hasHistory) {
      await tx.product.updateMany({
        where: { id, tenantId: tenant.id },
        data: { isActive: false },
      });
    } else {
      await tx.product.deleteMany({ where: { id, tenantId: tenant.id } });
    }

    await tx.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        action: hasHistory ? "product.deactivated" : "product.deleted",
        entity: "Product",
        entityId: id,
        details: hasHistory
          ? "Geçmiş kayıtlar nedeniyle ürün pasife alındı."
          : "Geçmiş kaydı olmayan ürün silindi.",
      },
    });
  });

  revalidatePath("/panel/products");
  revalidatePath("/panel");
  revalidatePath(`/shop/${tenant.slug}`);
}

export async function toggleProductAction(formData: FormData): Promise<void> {
  const { tenant, user } = await requireWritableTenantContext();
  const id = str(formData, "id");
  const active = str(formData, "isActive") === "true";
  if (!id) return;

  await withTenant(tenant.id, async (tx) => {
    const updated = await tx.product.updateMany({
      where: { id, tenantId: tenant.id },
      data: { isActive: active },
    });
    if (updated.count === 1) {
      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          action: active ? "product.activated" : "product.deactivated",
          entity: "Product",
          entityId: id,
        },
      });
    }
  });

  revalidatePath("/panel/products");
  revalidatePath(`/shop/${tenant.slug}`);
}

// ---------- Kategoriler ----------

export async function createCategoryAction(formData: FormData): Promise<void> {
  const { tenant } = await requireWritableTenantContext();
  const name = str(formData, "name");
  if (!name) return;

  await withTenant(tenant.id, async (tx) => {
    await tx.category.create({
      data: {
        tenantId: tenant.id,
        name,
        sortOrder: toInt(str(formData, "sortOrder"), 0),
      },
    });
  });

  revalidatePath("/panel/categories");
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const { tenant, user } = await requireWritableTenantContext();
  const id = str(formData, "id");
  if (!id) return;

  await withTenant(tenant.id, async (tx) => {
    const category = await tx.category.findFirst({
      where: { id, tenantId: tenant.id },
      select: { id: true, name: true },
    });
    if (!category) return;

    // Kategoriye bağlı ürünlerin kategorisini boşalt, sonra kategoriyi sil.
    await tx.product.updateMany({
      where: { categoryId: id, tenantId: tenant.id },
      data: { categoryId: null },
    });
    await tx.category.deleteMany({ where: { id, tenantId: tenant.id } });
    await tx.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        action: "category.deleted",
        entity: "Category",
        entityId: id,
        details: `Kategori silindi: ${category.name}`,
      },
    });
  });

  revalidatePath("/panel/categories");
  revalidatePath("/panel/products");
  revalidatePath(`/shop/${tenant.slug}`);
}
