"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { TenantStatus, SupportTicketStatus } from "@prisma/client";
import { prisma, withPlatform, withTenant } from "@/lib/db";
import { requirePlatformAdmin, requireTenantContext, requireWritableTenantContext } from "@/lib/session.server";
import { destroyAllSessionsForUser } from "@/lib/auth";
import { isValidEmail, str, toInt, toNumber } from "@/lib/validation";

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

/** Platform kullanıcı dizini; yalnızca görüntüleme işlemi yapar. */
export async function listPlatformUsers(search = "") {
  await requirePlatformAdmin();
  const query = search.trim().slice(0, 80);
  return withPlatform((tx) => tx.user.findMany({
    where: query ? {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true, name: true, email: true, isPlatformAdmin: true, isSuspended: true, createdAt: true,
      memberships: {
        select: {
          role: true,
          tenant: { select: { id: true, name: true, slug: true, status: true } },
        },
      },
      _count: { select: { sessions: true } },
    },
  }));
}

export async function listTenants() {
  await requirePlatformAdmin();
  return withPlatform((tx) => tx.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      plan: true,
      memberships: {
        where: { role: "OWNER" },
        select: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  }));
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
  const before = await prisma.tenant.findUnique({ where: { id }, select: { status: true } });
  if (!before || before.status === status) return;
  await prisma.tenant.update({ where: { id }, data: { status } });
  const admin = await requirePlatformAdmin();
  await withPlatform((tx) => tx.platformAuditLog.create({ data: { actorId: admin.user.id, action: "tenant.status.changed", targetType: "Tenant", targetId: id, reason: str(formData, "reason").slice(0, 300) || "İşletme durumu güncellendi", beforeData: { status: before.status }, afterData: { status } } }));
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
  const reason = str(formData, "reason").slice(0, 300);
  if (!id || !planId || reason.length < 5) return;

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  const tenant = await prisma.tenant.findUnique({ where: { id }, select: { planId: true } });
  if (!plan || !tenant || tenant.planId === planId) return;

  await prisma.tenant.update({ where: { id }, data: { planId } });
  const admin = await requirePlatformAdmin();
  await withPlatform((tx) => tx.platformAuditLog.create({ data: { actorId: admin.user.id, action: "tenant.plan.changed", targetType: "Tenant", targetId: id, reason, beforeData: { planId: tenant.planId }, afterData: { planId } } }));
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

  const createdPlan = await prisma.plan.create({
    data: {
      name,
      priceMonthly: Math.round(priceMonthly),
      maxProducts: Math.max(1, toInt(str(formData, "maxProducts"), 500)),
      maxStorageMb: Math.max(1, toInt(str(formData, "maxStorageMb"), 5000)),
    },
  });
  const admin = await requirePlatformAdmin();
  await withPlatform((tx) => tx.platformAuditLog.create({ data: { actorId: admin.user.id, action: "plan.created", targetType: "Plan", targetId: createdPlan.id, reason: "Yeni abonelik planı oluşturuldu", afterData: { name: createdPlan.name, priceMonthly: createdPlan.priceMonthly } } }));
  revalidatePath("/admin/plans");
}

export async function deletePlanAction(formData: FormData): Promise<void> {
  await requirePlatformAdmin();
  const id = str(formData, "id");
  if (!id) return;

  // Plana bağlı işletme varsa silme (veri kaybını önle).
  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) return;
  const inUse = await prisma.tenant.count({ where: { planId: id } });
  if (inUse > 0) return;

  await prisma.plan.deleteMany({ where: { id } });
  const admin = await requirePlatformAdmin();
  await withPlatform((tx) => tx.platformAuditLog.create({ data: { actorId: admin.user.id, action: "plan.deleted", targetType: "Plan", targetId: id, reason: "Kullanılmayan plan silindi", beforeData: { name: plan.name, priceMonthly: plan.priceMonthly } } }));
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
  await withPlatform((tx) => tx.platformAuditLog.create({ data: { actorId: admin.user.id, action: "payment.manual_recorded", targetType: "Tenant", targetId: tenantId, reason: description || "Manuel tahsilat kaydı", afterData: { amount, currency: "TRY" } } }));
  revalidatePath("/admin/payments");
  revalidatePath("/admin/logs");
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


/** Feature flag kayıtları platform çapında yönetilir. */
export async function listFeatureFlags() {
  await requirePlatformAdmin();
  return prisma.featureFlag.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });
}

export async function createFeatureFlagAction(formData: FormData): Promise<void> {
  const admin = await requirePlatformAdmin();
  const key = str(formData, "key").toLowerCase().replace(/[^a-z0-9_]+/g, "_").slice(0, 60);
  const name = str(formData, "name").slice(0, 100);
  const description = str(formData, "description").slice(0, 300);
  const category = str(formData, "category").slice(0, 40) || "product";
  if (!/^[a-z][a-z0-9_]{2,59}$/.test(key) || name.length < 2 || description.length < 5) return;
  if (await prisma.featureFlag.findUnique({ where: { key } })) return;

  const flag = await prisma.featureFlag.create({
    data: { key, name, description, category, enabled: false, updatedBy: admin.user.id, updatedAt: new Date() },
  });
  await withPlatform((tx) => tx.platformAuditLog.create({
    data: {
      actorId: admin.user.id, action: "feature_flag.created", targetType: "FeatureFlag",
      targetId: flag.id, reason: "Yeni özellik anahtarı oluşturuldu", afterData: { key, enabled: false },
    },
  }));
  revalidatePath("/admin/features");
}

export async function setFeatureFlagAction(formData: FormData): Promise<void> {
  const admin = await requirePlatformAdmin();
  const id = str(formData, "id");
  const enabled = str(formData, "enabled") === "true";
  const reason = str(formData, "reason").slice(0, 300);
  if (!id || reason.length < 5) return;

  const existing = await prisma.featureFlag.findUnique({ where: { id } });
  if (!existing || existing.enabled === enabled) return;
  await prisma.featureFlag.update({
    where: { id },
    data: { enabled, updatedBy: admin.user.id, updatedAt: new Date() },
  });
  await withPlatform((tx) => tx.platformAuditLog.create({
    data: {
      actorId: admin.user.id, action: "feature_flag.changed", targetType: "FeatureFlag",
      targetId: id, reason,
      beforeData: { enabled: existing.enabled, key: existing.key },
      afterData: { enabled, key: existing.key },
    },
  }));
  revalidatePath("/admin/features");
  revalidatePath("/admin/logs");
}

/** Platform çapındaki denetim izi; arama yalnızca güvenli metin alanlarında yapılır. */
export async function listPlatformAuditLogs(search = "") {
  await requirePlatformAdmin();
  const q = search.trim().slice(0, 80);
  return withPlatform((tx) => tx.platformAuditLog.findMany({
    where: q ? {
      OR: [
        { action: { contains: q, mode: "insensitive" } },
        { targetType: { contains: q, mode: "insensitive" } },
        { targetId: { contains: q, mode: "insensitive" } },
        { actorId: { contains: q, mode: "insensitive" } },
      ],
    } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  }));
}

export async function listSupportTickets() {
  await requirePlatformAdmin();
  return withPlatform(async (tx) => tx.supportTicket.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    include: {
      tenant: { select: { id: true, name: true, slug: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
  }));
}

export async function updateSupportTicketAction(formData: FormData): Promise<void> {
  const admin = await requirePlatformAdmin();
  const id = str(formData, "id");
  const status = str(formData, "status") as SupportTicketStatus;
  const resolutionNote = str(formData, "resolutionNote").slice(0, 1500);
  const reason = str(formData, "reason").slice(0, 300);
  const allowed: SupportTicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"];
  if (!id || !allowed.includes(status) || reason.length < 5) return;

  const ticket = await withPlatform(async (tx) => tx.supportTicket.findUnique({ where: { id } }));
  if (!ticket) return;
  const updated = await withTenant(ticket.tenantId, async (tx) => {
    const result = await tx.supportTicket.update({
      where: { id },
      data: { status, resolutionNote: resolutionNote || null, updatedAt: new Date() },
    });
    await tx.auditLog.create({
      data: {
        tenantId: ticket.tenantId, userId: admin.user.id,
        action: "support.ticket.updated", entity: "SupportTicket", entityId: id,
      },
    });
    return result;
  });
  await withPlatform((tx) => tx.platformAuditLog.create({
    data: {
      actorId: admin.user.id, action: "support.ticket.updated", targetType: "SupportTicket",
      targetId: id, reason,
      beforeData: { status: ticket.status },
      afterData: { status: updated.status },
    },
  }));
  revalidatePath("/admin/support");
  revalidatePath("/panel/support");
}

export async function listTenantSupportTickets() {
  const context = await requireTenantContext();
  const tickets = await withTenant(context.tenant.id, async (tx) => tx.supportTicket.findMany({
    where: { tenantId: context.tenant.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true, subject: true, description: true, status: true, priority: true,
      resolutionNote: true, createdAt: true, updatedAt: true, createdById: true,
    },
  }));
  return tickets.map((ticket) => ({ ...ticket, canDelete: ticket.createdById === context.user.id }));
}

export async function createSupportTicketAction(formData: FormData): Promise<void> {
  const context = await requireTenantContext();
  const subject = str(formData, "subject").slice(0, 120);
  const description = str(formData, "description").slice(0, 3000);
  const priority = str(formData, "priority");
  if (subject.length < 5 || description.length < 10) return;
  const safePriority = ["LOW", "NORMAL", "HIGH"].includes(priority) ? priority as "LOW" | "NORMAL" | "HIGH" : "NORMAL";

  await withTenant(context.tenant.id, async (tx) => {
    const ticket = await tx.supportTicket.create({
      data: {
        tenantId: context.tenant.id, createdById: context.user.id,
        subject, description, priority: safePriority, updatedAt: new Date(),
      },
    });
    await tx.auditLog.create({
      data: {
        tenantId: context.tenant.id, userId: context.user.id,
        action: "support.ticket.created", entity: "SupportTicket", entityId: ticket.id,
      },
    });
  });
  revalidatePath("/panel/support");
  revalidatePath("/admin/support");
}



/** Platform yöneticisi destek talebini kalıcı olarak silebilir; işlem denetim kaydına yazılır. */
export async function deleteSupportTicketAdminAction(formData: FormData): Promise<void> {
  const admin = await requirePlatformAdmin();
  const id = str(formData, "id");
  const reason = str(formData, "reason").slice(0, 300);
  if (!id || reason.length < 5) return;
  const ticket = await withPlatform((tx) => tx.supportTicket.findUnique({
    where: { id }, select: { id: true, tenantId: true, subject: true, status: true },
  }));
  if (!ticket) return;
  await withTenant(ticket.tenantId, async (tx) => {
    await tx.supportTicket.delete({ where: { id: ticket.id } });
    await tx.auditLog.create({ data: {
      tenantId: ticket.tenantId, userId: admin.user.id,
      action: "support.ticket.deleted", entity: "SupportTicket", entityId: ticket.id,
      details: reason,
    } });
  });
  await withPlatform((tx) => tx.platformAuditLog.create({ data: {
    actorId: admin.user.id, action: "support.ticket.deleted",
    targetType: "SupportTicket", targetId: ticket.id, reason,
    beforeData: { subject: ticket.subject, status: ticket.status, tenantId: ticket.tenantId },
  } }));
  revalidatePath("/admin/support");
  revalidatePath("/panel/support");
}

/** Kullanıcı yalnızca kendi oluşturduğu, kendi işletmesine ait talebi silebilir. */
export async function deleteOwnSupportTicketAction(formData: FormData): Promise<void> {
  const context = await requireTenantContext();
  const id = str(formData, "id");
  if (!id) return;
  await withTenant(context.tenant.id, async (tx) => {
    const ticket = await tx.supportTicket.findFirst({
      where: { id, tenantId: context.tenant.id, createdById: context.user.id },
      select: { id: true },
    });
    if (!ticket) return;
    await tx.supportTicket.delete({ where: { id: ticket.id } });
    await tx.auditLog.create({ data: {
      tenantId: context.tenant.id, userId: context.user.id,
      action: "support.ticket.deleted_by_creator", entity: "SupportTicket",
      entityId: ticket.id, details: "Talep sahibi tarafından silindi",
    } });
  });
  revalidatePath("/panel/support");
  revalidatePath("/admin/support");
}

/** Hesap askıya alma geri alınabilir; tüm mevcut oturum belirteçleri iptal edilir. */
export async function setPlatformUserSuspensionAction(formData: FormData): Promise<void> {
  const admin = await requirePlatformAdmin();
  const userId = str(formData, "userId");
  const suspended = str(formData, "suspended") === "true";
  const reason = str(formData, "reason").slice(0, 300);
  if (!userId || userId === admin.user.id || reason.length < 5) return;
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.isPlatformAdmin || target.isSuspended === suspended) return;

  await prisma.user.update({ where: { id: userId }, data: { isSuspended: suspended } });
  if (suspended) await destroyAllSessionsForUser(userId);
  await withPlatform((tx) => tx.platformAuditLog.create({
    data: {
      actorId: admin.user.id, action: suspended ? "user.suspended" : "user.reactivated",
      targetType: "User", targetId: userId, reason,
      beforeData: { isSuspended: target.isSuspended },
      afterData: { isSuspended: suspended },
    },
  }));
  revalidatePath("/admin/users");
  revalidatePath("/admin/logs");
}


/** İşletme sahibi, yalnızca kendi işletmesinin ekip üyelerini yönetebilir. */
export async function listTenantMembers() {
  const context = await requireTenantContext();
  if (context.role !== "OWNER") return [];
  return withTenant(context.tenant.id, async (tx) => tx.membership.findMany({
    where: { tenantId: context.tenant.id },
    orderBy: [{ role: "asc" }, { id: "asc" }],
    include: { user: { select: { id: true, name: true, email: true, createdAt: true, isSuspended: true } } },
  }));
}

export async function updateTenantMemberRoleAction(formData: FormData): Promise<void> {
  const context = await requireTenantContext();
  if (context.role !== "OWNER") return;
  const membershipId = str(formData, "membershipId");
  const role = str(formData, "role");
  const reason = str(formData, "reason").slice(0, 300);
  if (!membershipId || (role !== "OWNER" && role !== "STAFF") || reason.length < 5) return;

  await withTenant(context.tenant.id, async (tx) => {
    // Son sahip korumasında eşzamanlı rol değişikliklerini sıraya al.
    await tx.$queryRaw`SELECT id FROM "Tenant" WHERE id = ${context.tenant.id} FOR UPDATE`;
    const member = await tx.membership.findFirst({
      where: { id: membershipId, tenantId: context.tenant.id },
    });
    if (!member || member.role === role) return;
    if (member.role === "OWNER" && role === "STAFF") {
      const ownerCount = await tx.membership.count({
        where: { tenantId: context.tenant.id, role: "OWNER" },
      });
      if (ownerCount <= 1) return;
    }
    await tx.membership.update({ where: { id: membershipId }, data: { role } });
    await tx.auditLog.create({
      data: {
        tenantId: context.tenant.id, userId: context.user.id,
        action: "team.member.role_changed", entity: "Membership", entityId: membershipId, details: reason,
      },
    });
  });
  revalidatePath("/panel/team");
}


/** İşletme sahibi, kendisi dışındaki ekip üyeliğini güvenli biçimde kaldırabilir. */
export async function removeTenantMemberAction(formData: FormData): Promise<void> {
  const context = await requireTenantContext();
  if (context.role !== "OWNER") return;

  const membershipId = str(formData, "membershipId");
  const reason = str(formData, "reason").slice(0, 300);
  if (!membershipId || reason.length < 5) return;

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.platform', ${"on"}, true)`;
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${context.tenant.id}, true)`;
    // Son işletme sahibinin eşzamanlı iki işlemle kaldırılmasını önle.
    await tx.$queryRaw`SELECT id FROM "Tenant" WHERE id = ${context.tenant.id} FOR UPDATE`;

    const member = await tx.membership.findFirst({
      where: { id: membershipId, tenantId: context.tenant.id },
      include: { user: { select: { id: true, name: true, email: true, isPlatformAdmin: true } } },
    });
    if (!member || member.userId === context.user.id) return;

    if (member.role === "OWNER") {
      const ownerCount = await tx.membership.count({
        where: { tenantId: context.tenant.id, role: "OWNER" },
      });
      if (ownerCount <= 1) return;
    }

    await tx.auditLog.create({
      data: {
        tenantId: context.tenant.id,
        userId: context.user.id,
        action: "team.member.removed",
        entity: "Membership",
        entityId: member.id,
        details: reason,
      },
    });
    await tx.membership.delete({ where: { id: member.id } });

    const remainingMemberships = await tx.membership.count({
      where: { userId: member.userId },
    });
    if (remainingMemberships === 0 && !member.user.isPlatformAdmin) {
      // Başka işletmeye bağlı olmayan hesap artık kullanılabilir değildir.
      // Oturumlar User ilişkisi üzerinden CASCADE ile temizlenir.
      await tx.user.delete({ where: { id: member.userId } });
    } else {
      // Diğer işletmelerdeki üyeliği koru; yalnızca bu işletmeye bağlı oturumları kapat.
      await tx.session.deleteMany({
        where: { userId: member.userId, activeTenantId: context.tenant.id },
      });
    }
  });

  revalidatePath("/panel/team");
  revalidatePath("/admin/users");
  revalidatePath("/admin/tenants");
  revalidatePath("/admin/logs");
}

/** Platform yöneticisi yalnızca hiçbir işletmeye bağlı olmayan yetkisiz hesapları silebilir. */
export async function deleteOrphanPlatformUserAction(formData: FormData): Promise<void> {
  const admin = await requirePlatformAdmin();
  const userId = str(formData, "userId");
  const reason = str(formData, "reason").slice(0, 300);
  if (!userId || userId === admin.user.id || reason.length < 5) return;

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.platform', ${"on"}, true)`;
    const target = await tx.user.findUnique({
      where: { id: userId },
      include: { memberships: { select: { id: true } } },
    });
    if (!target || target.isPlatformAdmin || target.memberships.length > 0) return;

    await tx.platformAuditLog.create({
      data: {
        actorId: admin.user.id,
        action: "user.deleted",
        targetType: "User",
        targetId: target.id,
        reason,
        beforeData: { email: target.email, name: target.name },
      },
    });
    await tx.user.delete({ where: { id: target.id } });
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/logs");
}


/** İşletme sahibi, platformda zaten hesabı bulunan bir kullanıcıyı personel olarak ekleyebilir. */
export async function addExistingTenantMemberAction(formData: FormData): Promise<void> {
  const context = await requireWritableTenantContext();
  if (context.role !== "OWNER") return;

  const email = str(formData, "email").toLowerCase();
  if (!isValidEmail(email)) redirect("/panel/team?error=invalid-email");

  const result = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.platform', ${"on"}, true)`;
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${context.tenant.id}, true)`;

    const user = await tx.user.findUnique({
      where: { email },
      select: { id: true, isPlatformAdmin: true, isSuspended: true },
    });
    if (!user) return "not-found";
    if (user.isPlatformAdmin || user.isSuspended) return "not-eligible";

    const existing = await tx.membership.findFirst({
      where: { tenantId: context.tenant.id, userId: user.id },
      select: { id: true },
    });
    if (existing) return "already-member";

    const membership = await tx.membership.create({
      data: { tenantId: context.tenant.id, userId: user.id, role: "STAFF" },
    });
    await tx.auditLog.create({
      data: {
        tenantId: context.tenant.id,
        userId: context.user.id,
        action: "team.member.added",
        entity: "Membership",
        entityId: membership.id,
        details: `Mevcut hesap personel olarak eklendi: ${email}`,
      },
    });
    return "added";
  });

  if (result !== "added") redirect(`/panel/team?error=${result}`);
  revalidatePath("/panel/team");
  revalidatePath("/panel-secimi");
  revalidatePath("/admin/users");
  revalidatePath("/admin/tenants");
  redirect("/panel/team?success=added");
}
