/**
 * Edge (middleware) ve Node.js tarafında birlikte kullanılan sabitler.
 * Bu dosyada Prisma/Node.js'e özel import OLMAZ.
 */

// Subdomain olarak alınamayacak isimler
export const RESERVED_SLUGS = new Set([
  "www",
  "admin",
  "api",
  "app",
  "panel",
  "dashboard",
  "mail",
  "static",
  "cdn",
  "assets",
  "support",
  "help",
  "blog",
  "status",
  "staging",
  "dev",
  "test",
  "tivarto",
  "shop",
  "login",
  "register",
  "logout",
  "hesap-yok",
]);

export const SESSION_COOKIE_NAME = "tivarto_session";

/** Arayüzdeki "Demo" bilgilendirmesi (güvenlikle ilgisi yok, sadece etiket). */
export const DEMO_MODE = process.env.DEMO_MODE === "true";

/**
 * DEMO OTURUM ÇEREZLERİ
 * Demo girişinde hangi rolle girildiğini tarayıcıda taşır. Middleware (edge)
 * bu çerezlere bakarak /login → doğru panele yönlendirme yapar.
 * Hassas değildirler: oturum yetkisi her zaman `tivarto_session` + sunucu
 * tarafındaki oturum kaydıyla doğrulanır.
 */
export const DEMO_ROLE_COOKIE = "tivarto_demo_role";
export const DEMO_SESSION_COOKIE = "tivarto_demo";
export const DEMO_EMAIL_COOKIE = "tivarto_demo_email";

export type DemoRole = "admin" | "business" | "customer";

/** Demo mağaza / örnek müşteri sabitleri (demo veri katmanıyla ortak). */
export const DEMO_TENANT_ID = "demo-tenant-baharat";
export const DEMO_SHOP_SLUG = "demo";
export const DEMO_CUSTOMER_PHONE = "0555 123 45 67";

export const DEMO_ROLE_LABELS: Record<DemoRole, string> = {
  admin: "Platform Yöneticisi",
  business: "İşletme Yetkilisi",
  customer: "Müşteri",
};

/** Her rolün giriş sonrası açılacağı panel. */
export const DEMO_ROLE_DEST: Record<DemoRole, string> = {
  admin: "/admin",
  business: "/panel",
  customer: "/musteri",
};

/** Demo mağazada oturum açan örnek kullanıcılar (kimlik bilgisi değildir). */
export const DEMO_USERS: Record<
  DemoRole,
  {
    id: string;
    email: string;
    name: string;
    isPlatformAdmin: boolean;
    tenantId: string | null;
  }
> = {
  admin: {
    id: "demo-user-admin",
    email: "admin@tiverto.dev",
    name: "Platform Yöneticisi",
    isPlatformAdmin: true,
    // Platform yöneticisinin işletme üyeliği yoktur.
    tenantId: null,
  },
  business: {
    id: "demo-user-owner",
    email: "demo@tiverto.dev",
    name: "Ayşe Yılmaz",
    isPlatformAdmin: false,
    tenantId: DEMO_TENANT_ID,
  },
  customer: {
    id: "demo-user-customer",
    email: "musteri@tiverto.dev",
    name: "Zeynep Kaya",
    isPlatformAdmin: false,
    tenantId: null,
  },
};

export function isDemoRole(value: unknown): value is DemoRole {
  return value === "admin" || value === "business" || value === "customer";
}

/** Forma yazılan e-postadan / gelinen sayfadan demo rolünü tahmin eder. */
export function inferDemoRole(email: string, callbackUrl = ""): DemoRole {
  if (callbackUrl.startsWith("/admin")) return "admin";
  if (callbackUrl.startsWith("/musteri")) return "customer";
  if (callbackUrl.startsWith("/panel")) return "business";
  const value = email.toLowerCase();
  if (value.includes("admin") || value.includes("yonetici")) return "admin";
  if (
    value.includes("musteri") ||
    value.includes("customer") ||
    value.includes("müşteri")
  ) {
    return "customer";
  }
  return "business";
}

/** Açık yönlendirme (open redirect) engelli callbackUrl kontrolü. */
export function safeCallbackUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.length > 200 || /[\r\n]/.test(value)) return null;
  return value;
}

/** CallbackUrl yalnızca seçilen role ait panel ise kabul edilir. */
export function demoDestination(
  role: DemoRole,
  callbackUrl: unknown
): string {
  const destination = DEMO_ROLE_DEST[role];
  const safe = safeCallbackUrl(callbackUrl);
  if (
    safe &&
    (safe === destination ||
      safe.startsWith(`${destination}/`) ||
      safe.startsWith(`${destination}?`))
  ) {
    return safe;
  }
  return destination;
}

export function isValidSlug(slug: string): boolean {
  return (
    /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/.test(slug) &&
    !RESERVED_SLUGS.has(slug)
  );
}
