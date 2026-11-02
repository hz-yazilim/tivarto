import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import {
  validateSession,
  SESSION_COOKIE_NAME,
  prisma,
  type ValidSession,
} from "@/lib/auth";

export async function getSession(): Promise<ValidSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return validateSession(token);
}

export async function requireSession(): Promise<ValidSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("Giriş yapmalısınız.");
  }
  return session;
}

export async function getTenantContext(): Promise<{
  user: ValidSession["user"];
  tenant: NonNullable<
    Awaited<ReturnType<PrismaClient["tenant"]["findFirst"]>>
  >;
  role: string;
}> {
  const session = await requireSession();
  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: { tenant: true },
  });

  if (!membership || !membership.tenant) {
    throw new Error("İşletme bulunamadı.");
  }

  return {
    user: session.user,
    tenant: membership.tenant,
    role: String(membership.role),
  };
}
