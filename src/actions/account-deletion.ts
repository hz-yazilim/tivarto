"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { withPlatform } from "@/lib/db";

export async function completeExternalAccountDeletionAction(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  if (token.length < 32 || token.length > 128) redirect("/hesap-silme?status=invalid");

  const tokenHash = createHash("sha256").update(token).digest("hex");

  let result: "COMPLETED" | "OWNER_TRANSFER" | "INVALID";
  try {
    result = await withPlatform(async (tx): Promise<"COMPLETED" | "OWNER_TRANSFER" | "INVALID"> => {
      const deletionRequest = await tx.accountDeletionRequest.findUnique({
        where: { tokenHash },
      });
      if (
        !deletionRequest ||
        deletionRequest.status !== "PENDING_VERIFICATION" ||
        deletionRequest.expiresAt <= new Date()
      ) {
        return "INVALID";
      }

      const user = deletionRequest.userId
        ? await tx.user.findUnique({ where: { id: deletionRequest.userId } })
        : null;
      if (!user || user.isPlatformAdmin) {
        await tx.accountDeletionRequest.update({
          where: { id: deletionRequest.id },
          data: { status: "REJECTED", tokenHash: null, userId: null },
        });
        return "INVALID";
      }

      const memberships = await tx.membership.findMany({
        where: { userId: user.id },
        select: { role: true },
      });
      if (memberships.some((membership) => membership.role === "OWNER")) {
        await tx.accountDeletionRequest.update({
          where: { id: deletionRequest.id },
          data: { status: "VERIFIED", verifiedAt: new Date(), tokenHash: null },
        });
        return "OWNER_TRANSFER";
      }

      // Account data is removed; shared business and legally retained records remain.
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
      await tx.accountDeletionRequest.update({
        where: { id: deletionRequest.id },
        data: {
          status: "COMPLETED",
          verifiedAt: new Date(),
          completedAt: new Date(),
          userId: null,
          tokenHash: null,
        },
      });
      await tx.user.delete({ where: { id: user.id } });
      return "COMPLETED";
    });
  } catch (error) {
    console.error("external account deletion completion failed", error);
    redirect("/hesap-silme?status=error");
  }

  if (result === "COMPLETED") redirect("/hesap-silme?status=completed");
  if (result === "OWNER_TRANSFER") redirect("/hesap-silme?status=owner-transfer");
  redirect("/hesap-silme?status=invalid");
}
