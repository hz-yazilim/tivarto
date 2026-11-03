import { cookies } from "next/headers";
import {
  createSession,
  destroySession,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from "@/lib/auth";
import {
  DEMO_EMAIL_COOKIE,
  DEMO_ROLE_COOKIE,
  DEMO_SESSION_COOKIE,
  DEMO_USERS,
  type DemoRole,
} from "@/lib/constants";

const MAX_AGE = Math.floor(SESSION_TTL_MS / 1000);

/** Demo oturumunu işaretleyen (yetki vermeyen) çerezleri yazar. */
export async function markDemoSession(
  role: DemoRole,
  enteredEmail?: string
): Promise<void> {
  const cookieStore = await cookies();
  const shared = {
    httpOnly: false,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
  };
  cookieStore.set(DEMO_SESSION_COOKIE, "1", shared);
  cookieStore.set(DEMO_ROLE_COOKIE, role, shared);
  if (enteredEmail) {
    cookieStore.set(DEMO_EMAIL_COOKIE, enteredEmail.slice(0, 120), shared);
  } else {
    cookieStore.set(DEMO_EMAIL_COOKIE, "", { ...shared, maxAge: 0 });
  }
}

/**
 * Demo modunda seçilen rol için "giriş yapmış gibi" oturum açar.
 * Gönderilen e-posta/şifre doğrulanmaz; yalnızca ekranda gösterilmek üzere
 * e-posta bir çereze yazılır. Gerçek modda bu fonksiyon asla çağrılmaz.
 */
export async function startDemoSession(
  role: DemoRole,
  enteredEmail?: string
): Promise<void> {
  const cookieStore = await cookies();

  // Önceki oturumu kapat (rol değiştirirken eski token kalmasın).
  const previous = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (previous) await destroySession(previous).catch(() => {});

  const user = DEMO_USERS[role];
  // Platform yöneticisi oturumu herhangi bir işletmeye bağlanmaz.
  const token = await createSession(user.id, user.tenantId);

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
  });

  // Aşağıdaki çerezler yalnızca arayüz/middleware kolaylığı içindir; yetki
  // vermezler. Yetki her istekte `tivarto_session` ile doğrulanır.
  await markDemoSession(role, enteredEmail);
}

/** Çıkışta demo çerezlerini temizler (cookieStore sürümü). */
export async function clearDemoCookies(): Promise<void> {
  const cookieStore = await cookies();
  const options = {
    httpOnly: false,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  };
  cookieStore.set(DEMO_SESSION_COOKIE, "", options);
  cookieStore.set(DEMO_ROLE_COOKIE, "", options);
  cookieStore.set(DEMO_EMAIL_COOKIE, "", options);
}

/** /logout route handler'ı için temizlenecek demo çerezi adları. */
export const DEMO_COOKIE_NAMES = [
  DEMO_SESSION_COOKIE,
  DEMO_ROLE_COOKIE,
  DEMO_EMAIL_COOKIE,
];
