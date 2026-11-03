import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Membership, Tenant } from "@prisma/client";
import {
  validateSession,
  SESSION_COOKIE_NAME,
  type ValidSession,
} from "@/lib/auth";
import { DEMO_SESSION_COOKIE } from "@/lib/constants";
import { DEMO_ACTIVE } from "@/lib/demo-config";
import { prisma, withPlatform, withTenant } from "@/lib/db";

export type SessionUser = ValidSession["user"];

/** Çerezdeki oturumu (varsa) döner. */
export async function getSession(): Promise<ValidSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return validateSession(token);
}

/** Oturum yoksa hata fırlatır (kütüphane içi kullanım). */
export async function requireSession(): Promise<ValidSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("Giriş yapmalısınız.");
  }
  return session;
}

export interface TenantContext {
  user: SessionUser;
  tenant: Tenant;
  role: Membership["role"];
}

/**
 * Kullanıcının işletme bağlamını bulur.
 *
 * ÖNEMLİ: `Membership` tablosu RLS korumalıdır (satırın tenantId'sini bilmeden
 * okunamaz — bu tavuk-yumurta problemi bilinçli bir tasarım tercihidir).
 * Bu yüzden hangi işletmeye ait olduğumuzu `Session` üzerinden taşırız:
 * oturum açılışında aktif işletme bir kez belirlenir ve Session.activeTenantId
 * alanına yazılır. Burada RLS'siz tablolar (Session, User, Tenant) okunur.
 */
export async function getTenantContext(): Promise<TenantContext> {
  const session = await getSession();
  if (!session) {
    throw new Error("Giriş yapmalısınız.");
  }
  return resolveTenantContext(session);
}

/**
 * Oturum açmış kullanıcının işletme bağlamını (RLS bağlamı kurarak) çözer.
 * `getTenantContext` (fırlatır) ve `requireTenantContext` (yönlendirir)
 * aynı mantığı paylaşsın diye ayrıldı.
 */
async function resolveTenantContext(session: ValidSession): Promise<TenantContext> {
  // Aktif işletme, OTURUM AÇAN çerezdeki oturumdan okunur (kullanıcının en son
  // oturumu değil) — aksi halde ikinci bir tarayıcı aktif işletmeyi karıştırabilir.
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? "";

  const record = await prisma.session.findFirst({
    where: { token, userId: session.user.id },
    select: { activeTenantId: true },
  });

  const tenantId = record?.activeTenantId ?? (await resolveTenantId(session.user.id, token));
  if (!tenantId) {
    throw new Error("İşletme bulunamadı.");
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    throw new Error("İşletme bulunamadı.");
  }

  // Rol bilgisi tenant bağlamı kurularak okunur.
  const role = await withTenant(tenant.id, async (tx) => {
    const membership = await tx.membership.findFirst({
      where: { userId: session.user.id, tenantId: tenant.id },
      select: { role: true },
    });
    if (!membership) {
      throw new Error("Bu işletme için aktif üyeliğiniz bulunmuyor.");
    }
    return membership.role;
  });

  return { user: session.user, tenant, role };
}

/**
 * Oturumda aktif işletme yoksa (örn. eski oturumlar) ilk üyeliği bulup
 * oturuma yazar. Üyelik okuması için platform bağlamı gerekir.
 */
async function resolveTenantId(
  userId: string,
  token = ""
): Promise<string | null> {
  const membership = await withPlatform(async (tx) =>
    tx.membership.findFirst({
      where: { userId },
      orderBy: { id: "asc" },
      select: { tenantId: true },
    })
  );

  if (!membership) return null;

  await prisma.session.updateMany({
    where: { userId, activeTenantId: null, ...(token ? { token } : {}) },
    data: { activeTenantId: membership.tenantId },
  });

  return membership.tenantId;
}

/**
 * Sayfalar ve server action'lar için güvenli sürüm:
 * oturum yoksa /login'e, işletme yoksa /hesap-yok'a yönlendirir.
 */
export async function requireTenantContext(): Promise<TenantContext> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  try {
    return await resolveTenantContext(session);
  } catch {
    redirect("/hesap-yok");
  }
}

/** Askıya alınmış işletmelerin veri değiştiren işlemlerini engeller. */
export async function requireWritableTenantContext(): Promise<TenantContext> {
  const context = await requireTenantContext();
  if (context.tenant.status !== "ACTIVE") {
    redirect("/panel?error=isletme-askida");
  }
  const maintenance = await prisma.featureFlag.findUnique({
    where: { key: "maintenance_mode" },
    select: { enabled: true },
  });
  if (maintenance?.enabled) {
    redirect("/panel?error=maintenance");
  }
  return context;
}


/** Sadece platform yöneticisi. Değilse panele gönderir. */
export async function requirePlatformAdmin(): Promise<ValidSession> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (!session.user.isPlatformAdmin) {
    // Demo veri katmanı açıkken üç panelin tamamı gezilebilsin: demo oturumu
    // platform paneline de erişir. Gerçek modda bu istisna yoktur (RLS + rol
    // kontrolü aynen çalışmaya devam eder).
    const isDemoSession =
      DEMO_ACTIVE &&
      (await cookies()).get(DEMO_SESSION_COOKIE)?.value === "1";
    if (!isDemoSession) {
      redirect("/panel");
    }
  }
  return session;
}
