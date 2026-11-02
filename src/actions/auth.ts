"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  hashPassword,
  createSession,
  destroySession,
  destroyAllSessionsForUser,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  prisma,
} from "@/lib/auth";
import { isValidSlug } from "@/lib/reserved";

async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function loginAction(prevState: any, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "E-posta ve şifre gereklidir." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "E-posta veya şifre hatalı." };
  }

  const valid = await requirePasswordCompare(password, user.passwordHash);
  if (!valid) {
    return { error: "E-posta veya şifre hatalı." };
  }

  const token = await createSession(user.id);
  setSessionCookie(token);

  const isAdmin = user.isPlatformAdmin;
  redirect(isAdmin ? "/admin" : "/panel");
}

export async function registerAction(prevState: any, formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const name = (formData.get("name") as string)?.trim();
  const businessName = (formData.get("businessName") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim().toLowerCase();
  const planId = (formData.get("planId") as string) || undefined;

  if (!email || !password || !name || !businessName || !slug) {
    return { error: "Tüm alanları doldurun." };
  }
  if (password.length < 6) {
    return { error: "Şifre en az 6 karakter olmalıdır." };
  }
  if (!isValidSlug(slug)) {
    return { error: "Geçersiz subdomain adı (sadece küçük harf, rakam ve tire; 3-30 karakter)." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "Bu e-posta adresiyle kayıtlı bir hesap zaten var." };
  }

  const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
  if (existingTenant) {
    return { error: "Bu subdomain adı zaten kullanımda." };
  }

  let plan = await prisma.plan.findFirst({
    where: { name: { equals: "Başlangıç", mode: "insensitive" } },
  });
  if (planId) {
    const p = await prisma.plan.findUnique({ where: { id: planId } });
    if (p) plan = p;
  }
  if (!plan) {
    plan = await prisma.plan.create({
      data: { name: "Başlangıç", priceMonthly: 399, maxProducts: 500, maxStorageMb: 5000 },
    });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  const tenant = await prisma.tenant.create({
    data: { slug, name: businessName, planId: plan.id },
  });

  await prisma.$transaction(async (tx: any) => {
    await tx.membership.create({
      data: { tenantId: tenant.id, userId: user.id, role: "OWNER" },
    });
    await tx.storeSettings.create({
      data: { tenantId: tenant.id, theme: "default" },
    });
    await tx.category.createMany({
      data: [
        { name: "Genel", tenantId: tenant.id, sortOrder: 1 },
        { name: "Gıda", tenantId: tenant.id, sortOrder: 2 },
        { name: "İçecek", tenantId: tenant.id, sortOrder: 3 },
        { name: "Temizlik", tenantId: tenant.id, sortOrder: 4 },
      ],
    });
  });

  const token = await createSession(user.id);
  setSessionCookie(token);

  redirect("/panel");
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      await destroySession(token);
    }
    cookieStore.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    });
  } catch {
    // ignore
  }
  redirect("/login");
}

async function requirePasswordCompare(plain: string, hash: string): Promise<boolean> {
  const { comparePassword } = await import("@/lib/auth");
  return comparePassword(plain, hash);
}
