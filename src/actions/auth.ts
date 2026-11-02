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
  SESSION_TTL_MS,
} from "@/lib/auth";
import { isValidSlug, SESSION_COOKIE_NAME } from "@/lib/constants";
import { prisma, withPlatform } from "@/lib/db";
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

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "E-posta veya şifre hatalı." };
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    return { error: "E-posta veya şifre hatalı." };
  }

  // Aktif işletmeyi oturum açılışında belirle (RLS: üyelik okuması için platform bağlamı).
  const activeTenantId = await withPlatform(async (tx) => {
    const membership = await tx.membership.findFirst({
      where: { userId: user.id },
      orderBy: { id: "asc" },
      select: { tenantId: true },
    });
    return membership?.tenantId ?? null;
  });

  const token = await createSession(user.id, activeTenantId);
  await setSessionCookie(token);

  redirect(user.isPlatformAdmin ? "/admin" : "/panel");
}

export async function registerAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
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
  } catch {
    // Çıkış sırasında hata olsa da kullanıcıyı girişe gönder.
  }
  redirect("/login");
}
