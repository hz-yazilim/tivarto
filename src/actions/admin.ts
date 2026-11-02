"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session.server";
import { prisma } from "@/lib/auth";

export async function adminDashboardStats() {
  const session = await requireSession();
  if (!session.user.isPlatformAdmin) redirect("/panel");

  const [tenantCount, activeTenants, suspendedTenants, planCount, paymentTotal] =
    await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: "ACTIVE" } }),
      prisma.tenant.count({ where: { status: "SUSPENDED" } }),
      prisma.plan.count(),
      prisma.payment.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
      }),
    ]);

  return {
    tenantCount,
    activeTenants,
    suspendedTenants,
    planCount,
    paymentTotal: paymentTotal._sum.amount || 0,
  };
}

export async function listTenants() {
  const session = await requireSession();
  if (!session.user.isPlatformAdmin) redirect("/panel");
  return prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: { plan: true, _count: { select: { memberships: true, products: true, orders: true } } },
  });
}

export async function updateTenantStatus(formData: FormData): Promise<void> {
  const session = await requireSession();
  if (!session.user.isPlatformAdmin) return;
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;
  if (!id || !status) return;
  await prisma.tenant.update({ where: { id }, data: { status } });
  redirect("/admin/tenants");
}

export async function updateTenantPlan(formData: FormData): Promise<void> {
  const session = await requireSession();
  if (!session.user.isPlatformAdmin) return;
  const id = formData.get("id") as string;
  const planId = formData.get("planId") as string;
  if (!id || !planId) return;
  await prisma.tenant.update({ where: { id }, data: { planId } });
  redirect("/admin/tenants");
}

export async function listPlans() {
  const session = await requireSession();
  if (!session.user.isPlatformAdmin) redirect("/panel");
  return prisma.plan.findMany({ orderBy: { priceMonthly: "asc" } });
}

export async function createPlanAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  if (!session.user.isPlatformAdmin) return;
  const name = (formData.get("name") as string)?.trim();
  const priceMonthly = parseInt(formData.get("priceMonthly") as string, 10);
  const maxProducts = parseInt(formData.get("maxProducts") as string, 10);
  const maxStorageMb = parseInt(formData.get("maxStorageMb") as string, 10);
  if (!name || Number.isNaN(priceMonthly)) return;
  await prisma.plan.create({
    data: {
      name,
      priceMonthly,
      maxProducts: Number.isNaN(maxProducts) ? 500 : maxProducts,
      maxStorageMb: Number.isNaN(maxStorageMb) ? 5000 : maxStorageMb,
    },
  });
  redirect("/admin/plans");
}

export async function deletePlanAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  if (!session.user.isPlatformAdmin) return;
  const id = formData.get("id") as string;
  if (!id) return;
  await prisma.plan.deleteMany({ where: { id } });
}

export async function listPayments() {
  const session = await requireSession();
  if (!session.user.isPlatformAdmin) redirect("/panel");
  return prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    include: { tenant: true },
  });
}

export async function createPaymentAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  if (!session.user.isPlatformAdmin) return;
  const tenantId = formData.get("tenantId") as string;
  const amount = parseFloat((formData.get("amount") as string).replace(",", "."));
  const description = (formData.get("description") as string) || undefined;
  if (!tenantId || Number.isNaN(amount)) return;
  await prisma.payment.create({
    data: { tenantId, amount, status: "PAID", description, paidAt: new Date() },
  });
  redirect("/admin/payments");
}

export async function listAuditLogs() {
  const session = await requireSession();
  if (!session.user.isPlatformAdmin) redirect("/panel");
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { tenant: true },
  });
}
