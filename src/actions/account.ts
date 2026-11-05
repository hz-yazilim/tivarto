"use server";

import { redirect } from "next/navigation";
import { comparePassword } from "@/lib/auth";
import { clearDemoCookies } from "@/lib/demo-session.server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { prisma, withPlatform } from "@/lib/db";
import { getSession } from "@/lib/session.server";

export type AccountDeletionState = { error?: string };

/**
 * Deletes the authenticated user's account only after password + phrase
 * confirmation. Business owners must transfer every OWNER role first.
 * Tenant/business records are intentionally preserved.
 */
export async function deleteOwnAccountAction(
  _previous: AccountDeletionState,
  formData: FormData
): Promise<AccountDeletionState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (confirmation !== "HESABIMI SIL") {
    return { error: "Onay metni doğru değil. HESABIMI SIL yazmalısınız." };
  }
  if (password.length < 1 || password.length > 256) {
    return { error: "Devam etmek için mevcut şifrenizi girin." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true, isPlatformAdmin: true },
  });
  if (!user) redirect("/login");
  if (user.isPlatformAdmin) {
    return { error: "Platform yönetici hesabı bu ekrandan silinemez. Yönetici hesabı için ayrı bir güvenlik ve devir süreci gerekir." };
  }

  const validPassword = await comparePassword(password, user.passwordHash);
  if (!validPassword) {
    return { error: "Mevcut şifreniz hatalı." };
  }

  try {
    await withPlatform(async (tx) => {
      const memberships = await tx.membership.findMany({
        where: { userId: user.id },
        select: { id: true, role: true, tenantId: true },
      });

      // Ownership is a business responsibility; never cascade-delete a tenant.
      if (memberships.some((membership) => membership.role === "OWNER")) {
        throw new Error("OWNER_TRANSFER_REQUIRED");
      }

      // Preserve the shared business records, but remove direct account links.
      await tx.auditLog.updateMany({
        where: { userId: user.id },
        data: { userId: null },
      });
      await tx.supportTicket.updateMany({
        where: { createdById: user.id },
        data: { createdById: null },
      });
      await tx.platformAuditLog.updateMany({
        where: { actorId: user.id },
        data: { actorId: null },
      });

      await tx.membership.deleteMany({ where: { userId: user.id } });
      await tx.session.deleteMany({ where: { userId: user.id } });
      await tx.accountDeletionRequest.updateMany({
        where: { userId: user.id, status: "VERIFIED" },
        data: { status: "COMPLETED", userId: null, tokenHash: null, completedAt: new Date() },
      });
      await tx.user.delete({ where: { id: user.id } });

      // Do not write the deleted user's email, name, or ID to the audit log.
      await tx.platformAuditLog.create({
        data: {
          action: "account.deleted_by_owner",
          targetType: "Account",
          reason: "Authenticated user requested permanent account deletion.",
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "OWNER_TRANSFER_REQUIRED") {
      return {
        error: "Bu hesap en az bir işletmenin sahibi. Önce Ekip bölümünden başka bir kullanıcıyı işletme sahibi yapıp kendi sahipliğinizi devretmelisiniz. İşletme ve diğer kullanıcıların verileri silinmez.",
      };
    }
    console.error("account deletion failed", error);
    return { error: "Hesap silme işlemi tamamlanamadı. Verileriniz değiştirilmedi; lütfen destek ekibiyle iletişime geçin." };
  }

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  await clearDemoCookies();
  redirect("/login?accountDeleted=1");
}
