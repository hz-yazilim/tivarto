"use server";

import { revalidatePath } from "next/cache";
import type { TenantStatus } from "@prisma/client";
import { prisma, withPlatform, withTenant } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/session.server";
import { str, toInt, toNumber } from "@/lib/validation";

/**
 * PLATFORM YÖNETİCİSİ İŞLEMLERİ
 * -----------------------------
 * - Tenant verisine erişen sorgular `withPlatform()` (RLS: app.platform='on') içinde çalışır.
 * - Plan/User/Session gibi platform tabloları RLS'siz olduğu için normal `prisma` ile okunur.
 * - Her action ilk satırda yetki kontrolü yapar.
 */

export async function adminDashboardStats() {
  await requirePlatformAdmin();

  const [tenantCount, activeTenants, planCount, userCount] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "ACTIVE" } }),
    prisma.plan.count(),
    prisma.user.count(),
  ]);

  const paymentTotal = await withPlatform(async (tx) => {
    const result = await tx.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  });

  return {
    tenantCount,
    activeTenants,
    suspendedTenants: tenantCount - activeTenants,
    planCount,
    paymentTotal,
    userCount,
  };
}

export async function listTenants() {
  await requirePlatformAdmin();
  return prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  });
}

export async function listTenantUsage() {
  await requirePlatformAdmin();
  return withPlatform(async (tx) => {
    const [products, orders] = await Promise.all([
      tx.product.groupBy({ by: ["tenantId"], _count: { _all: true } }),
      tx.order.groupBy({ by: ["tenantId"], _count: { _all: true } }),
    ]);
    return {
      products: new Map(products.map((p) => [p.tenantId, p._count._all])),
      orders: new Map(orders.map((o) => [o.tenantId, o._count._all])),
    };
  });
}

export async function updateTenantStatus(formData: FormData): Promise<void> {
  await requirePlatformAdmin();
  const id = str(formData, "id");
  const status = str(formData, "status") as TenantStatus;
  if (!id || (status !== "ACTIVE" && status !== "SUSPENDED")) return;

  // Tenant tablosu platform seviyesindedir (RLS yok).
  await prisma.tenant.update({ where: { id }, data: { status } });
  await withTenant(id, async (tx) => {
    await tx.auditLog.create({
      data: {
        tenantId: id,
        action: `tenant.status.${status.toLowerCase()}`,
        entity: "Tenant",
        entityId: id,
      },
    });
  });
  revalidatePath("/admin/tenants");
}

export async function updateTenantPlan(formData: FormData): Promise<void> {
  await requirePlatformAdmin();
  const id = str(formData, "id");
  const planId = str(formData, "planId");
  if (!id || !planId) return;

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) return;

  await prisma.tenant.update({ where: { id }, data: { planId } });
  revalidatePath("/admin/tenants");
}

export async function listPlans() {
  await requirePlatformAdmin();
  return prisma.plan.findMany({ orderBy: { priceMonthly: "asc" } });
}

export async function createPlanAction(formData: FormData): Promise<void> {
  await requirePlatformAdmin();
  const name = str(formData, "name");
  const priceMonthly = toNumber(str(formData, "priceMonthly"));
  if (!name || priceMonthly === undefined || priceMonthly < 0) return;

  const exists = await prisma.plan.findUnique({ where: { name } });
  if (exists) return;

  await prisma.plan.create({
    data: {
      name,
      priceMonthly: Math.round(priceMonthly),
      maxProducts: Math.max(1, toInt(str(formData, "maxProducts"), 500)),
      maxStorageMb: Math.max(1, toInt(str(formData, "maxStorageMb"), 5000)),
    },
  });
  revalidatePath("/admin/plans");
}

export async function deletePlanAction(formData: FormData): Promise<void> {
  await requirePlatformAdmin();
  const id = str(formData, "id");
  if (!id) return;

  // Plana bağlı işletme varsa silme (veri kaybını önle).
  const inUse = await prisma.tenant.count({ where: { planId: id } });
  if (inUse > 0) return;

  await prisma.plan.deleteMany({ where: { id } });
  revalidatePath("/admin/plans");
}

export async function listPayments() {
  await requirePlatformAdmin();
  return withPlatform(async (tx) => {
    return tx.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { tenant: true },
    });
  });
}

export async function createPaymentAction(formData: FormData): Promise<void> {
  const admin = await requirePlatformAdmin();
  const tenantId = str(formData, "tenantId");
  const amount = toNumber(str(formData, "amount"));
  const description = str(formData, "description") || null;
  if (!tenantId || amount === undefined || amount <= 0) return;

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return;

  // Payment/tenant verisi: RLS bağlamı tenant olarak kurulur.
  await withTenant(tenantId, async (tx) => {
    const payment = await tx.payment.create({
      data: { tenantId, amount, status: "PAID", description, paidAt: new Date() },
    });
    await tx.auditLog.create({
      data: {
        tenantId,
        userId: admin.user.id,
        action: "payment.manual_record",
        entity: "Payment",
        entityId: payment.id,
      },
    });
  });
  revalidatePath("/admin/payments");
}

export async function listAuditLogs() {
  await requirePlatformAdmin();
  return withPlatform(async (tx) => {
    return tx.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { tenant: true },
    });
  });
}
