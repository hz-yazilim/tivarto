"use server";

import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import {
  hashPassword,
  comparePassword,
  createSession,
  destroySession,
  destroyAllSessionsForUser,
  pruneExpiredSessions,
  SESSION_TTL_MS,
} from "@/lib/auth";
import {
  isValidSlug,
  PLATFORM_ADMIN_EMAIL,
  SESSION_COOKIE_NAME,
} from "@/lib/constants";
import { DEMO_ACTIVE } from "@/lib/demo-config";
import {
  clearDemoCookies,
} from "@/lib/demo-session.server";
import { prisma, withPlatform } from "@/lib/db";
import { getSession } from "@/lib/session.server";
import { isValidEmail, str, type FormState } from "@/lib/validation";

async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}

export async function loginAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const email = str(formData, "email").toLowerCase();
  const password = str(formData, "password");

  if (!email || !password) {
    return { error: "E-posta ve şifre gereklidir." };
  }

  // Demo/önizleme modu kimlik doğrulamayı atlayamaz; tüm girişler gerçek
  // veritabanı parolasıyla doğrulanır.
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "E-posta veya şifre hatalı." };
  }
  if (user.isSuspended) {
    return { error: "Bu hesap geçici olarak askıya alınmıştır. Destek ekibiyle iletişime geçin." };
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    return { error: "E-posta veya şifre hatalı." };
  }

  // Başarılı girişlerde süresi dolmuş oturumları fırsat buldukça temizle.
  // Ayrı bir sürekli çalışan servis/cron gerektirmez.
  await pruneExpiredSessions().catch(() => 0);

  // Kullanıcının tüm işletme üyeliklerini getir; birden fazlaysa panel seçimi açılır.
  const memberships = user.isPlatformAdmin ? [] : await withPlatform(async (tx) =>
    tx.membership.findMany({
      where: { userId: user.id },
      orderBy: { tenant: { name: "asc" } },
      select: { tenantId: true },
    })
  );
  const activeTenantId = memberships[0]?.tenantId ?? null;

  const token = await createSession(user.id, activeTenantId);
  await setSessionCookie(token);

  if (user.mustChangePassword) redirect("/change-password");
  const isAllowedPlatformAdmin =
    user.isPlatformAdmin &&
    user.email.trim().toLowerCase() === PLATFORM_ADMIN_EMAIL;
  if (isAllowedPlatformAdmin) redirect("/admin");
  if (memberships.length === 0) redirect("/hesap-yok");
  redirect(memberships.length > 1 ? "/panel-secimi" : "/panel");
}

/** Demo akışları yönetici oturumu üretemez; gerçek parola girişi gerekir. */
export async function demoStartPanelSelectionAction(): Promise<void> {
  redirect("/login?error=demo-admin-disabled");
}

export async function demoSwitchRoleAction(_formData: FormData): Promise<void> {
  redirect("/login?callbackUrl=%2Fadmin");
}

export async function registerAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  if (DEMO_ACTIVE) {
    return { error: "Demo önizlemesinde işletme kaydı kapalıdır. Platform yönetim panelini kullanın." };
  }
  const maintenance = await prisma.featureFlag.findUnique({ where: { key: "maintenance_mode" }, select: { enabled: true } });
  if (maintenance?.enabled) return { error: "Yeni işletme kayıtları bakım süresince geçici olarak durdurulmuştur." };

  const email = str(formData, "email").toLowerCase();
  const password = str(formData, "password");
  const name = str(formData, "name");
  const businessName = str(formData, "businessName");
  const slug = str(formData, "slug").toLowerCase();

  if (!email || !password || !name || !businessName || !slug) {
    return { error: "Tüm alanları doldurun." };
  }
  if (!isValidEmail(email)) {
    return { error: "Geçerli bir e-posta adresi girin." };
  }
  if (password.length < 8) {
    return { error: "Şifre en az 8 karakter olmalıdır." };
  }
  if (!isValidSlug(slug)) {
    return {
      error:
        "Geçersiz mağaza adresi. Sadece küçük harf, rakam ve tire kullanın (3-30 karakter) ve rezerve isimlerden kaçının.",
    };
  }

  const [existingUser, existingTenant] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.tenant.findUnique({ where: { slug } }),
  ]);
  if (existingUser) {
    return { error: "Bu e-posta adresiyle kayıtlı bir hesap zaten var." };
  }
  if (existingTenant) {
    return { error: "Bu mağaza adresi zaten kullanımda." };
  }

  const passwordHash = await hashPassword(password);

  // Plan yoksa varsayılan planı oluştur (tek seferlik).
  let plan = await prisma.plan.findFirst({ orderBy: { priceMonthly: "asc" } });
  if (!plan) {
    plan = await prisma.plan.create({
      data: {
        name: "Başlangıç",
        priceMonthly: 399,
        maxProducts: 500,
        maxStorageMb: 5000,
      },
    });
  }

  const tenantId = crypto.randomUUID();
  const userId = crypto.randomUUID();

  try {
    // Tek transaction: kullanıcı + işletme + üyelik + mağaza ayarları + başlangıç kategorileri.
    await prisma.$transaction(async (tx) => {
      // Yeni işletme kaydı: hem kendi tenant'ı hem platform görünürlüğü gerekir.
      await tx.$executeRaw`SELECT set_config('app.platform', ${"on"}, true)`;
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

      await tx.user.create({
        data: { id: userId, email, passwordHash, name },
      });
      await tx.tenant.create({
        data: { id: tenantId, slug, name: businessName, planId: plan.id },
      });
      await tx.membership.create({
        data: { tenantId, userId, role: "OWNER" },
      });
      await tx.storeSettings.create({
        data: { tenantId, theme: "default" },
      });
      await tx.category.createMany({
        data: [
          { tenantId, name: "Genel", sortOrder: 1 },
          { tenantId, name: "Gıda", sortOrder: 2 },
          { tenantId, name: "İçecek", sortOrder: 3 },
          { tenantId, name: "Temizlik", sortOrder: 4 },
        ],
      });
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: "tenant.create",
          entity: "Tenant",
          entityId: tenantId,
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "Bu e-posta veya mağaza adresi zaten kullanımda." };
    }
    console.error("register error", error);
    return {
      error:
        "Kayıt oluşturulamadı. Veritabanı bağlantısı yapılandırılmamış olabilir.",
    };
  }

  const token = await createSession(userId, tenantId);
  await setSessionCookie(token);

  redirect("/panel-secimi");
}

/** Oturum açmış kullanıcının yalnızca üyesi olduğu işletmeye geçmesini sağlar. */
export async function switchActiveTenantAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.mustChangePassword) redirect("/change-password");

  const tenantId = str(formData, "tenantId");
  if (!tenantId) redirect("/panel-secimi");

  const membership = await withPlatform((tx) =>
    tx.membership.findFirst({
      where: { userId: session.user.id, tenantId },
      select: { tenantId: true },
    })
  );
  if (!membership) redirect("/hesap-yok");

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) redirect("/login");

  const changed = await prisma.session.updateMany({
    where: { token, userId: session.user.id, expiresAt: { gt: new Date() } },
    data: { activeTenantId: tenantId },
  });
  if (changed.count !== 1) redirect("/login");

  redirect("/panel");
}

/** Oturumu kapatır ve giriş sayfasına yönlendirir. */
export async function logoutAction(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      await destroySession(token);
    }
    await clearSessionCookie();
    await clearDemoCookies();
  } catch {
    // Çıkış sırasında hata olsa da kullanıcıyı girişe gönder.
  }
  redirect("/login");
}


/** İlk girişte geçici şifreyi yeni ve güçlü bir şifreyle değiştirme. */
export async function changePasswordAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.user.mustChangePassword) redirect(session.user.isPlatformAdmin ? "/admin" : "/panel");

  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (password.length < 12) redirect("/change-password?error=short");
  if (password !== confirmation) redirect("/change-password?error=mismatch");

  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash, mustChangePassword: false },
  });

  await destroyAllSessionsForUser(session.user.id);
  const activeTenantId = session.user.isPlatformAdmin ? null : await withPlatform(async (tx) => {
    const membership = await tx.membership.findFirst({
      where: { userId: session.user.id },
      orderBy: { tenant: { name: "asc" } },
      select: { tenantId: true },
    });
    return membership?.tenantId ?? null;
  });
  const token = await createSession(session.user.id, activeTenantId);
  await setSessionCookie(token);
  redirect(session.user.isPlatformAdmin ? "/admin" : "/panel-secimi");
}
