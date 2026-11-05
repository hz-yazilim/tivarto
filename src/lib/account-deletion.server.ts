import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

export type DeletionLinkState = "READY" | "EXPIRED" | "INVALID" | "ALREADY_VERIFIED";

export async function getDeletionLinkState(token: string): Promise<DeletionLinkState> {
  if (!token || token.length < 32 || token.length > 128) return "INVALID";
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const request = await prisma.accountDeletionRequest.findUnique({
    where: { tokenHash },
    select: { status: true, expiresAt: true },
  });
  if (!request) return "INVALID";
  if (request.status === "VERIFIED") return "ALREADY_VERIFIED";
  if (request.status !== "PENDING_VERIFICATION") return "INVALID";
  if (request.expiresAt <= new Date()) return "EXPIRED";
  return "READY";
}
