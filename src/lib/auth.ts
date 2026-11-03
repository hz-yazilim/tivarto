import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/db";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export const SESSION_COOKIE_NAME = "tivarto_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 gün

export async function createSession(
  userId: string,
  activeTenantId?: string | null
): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      token,
      userId,
      activeTenantId: activeTenantId ?? null,
      expiresAt,
    },
  });

  return token;
}

export async function destroySession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } }).catch(() => {
    // Zaten yoksa sorun değil.
  });
}

export async function destroyAllSessionsForUser(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

export interface ValidSession {
  user: {
    id: string;
    email: string;
    name: string | null;
    isPlatformAdmin: boolean;
  };
}

/**
 * Oturum belirtecini doğrular.
 * NOT: Bu fonksiyon Node.js runtime'a ihtiyaç duyar (Prisma + bcrypt).
 * Edge middleware içinden çağrılmamalıdır; middleware sadece çerez varlığına bakar.
 */
export async function validateSession(
  token: string | undefined
): Promise<ValidSession | null> {
  if (!token) return null;

  const session = await prisma.session.findFirst({
    where: {
      token,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!session || !session.user || session.user.isSuspended) return null;

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      isPlatformAdmin: session.user.isPlatformAdmin,
    },
  };
}

/** Süresi geçmiş oturumları temizler (cron/health çağrısı için). */
export async function pruneExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
  return result.count;
}
