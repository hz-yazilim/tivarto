import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware EDGE runtime'da çalışır: Prisma/bcrypt burada KULLANILAMAZ.
 * Bu yüzden burada sadece çerez varlığına bakılır; oturumun geçerliliği
 * sayfa/layout katmanında (Node.js runtime) doğrulanır.
 */
import {
  DEMO_ROLE_COOKIE,
  DEMO_SESSION_COOKIE,
  RESERVED_SLUGS,
  SESSION_COOKIE_NAME,
} from "./lib/constants";

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "";
const rootHost = ROOT.split(":")[0].toString().toLowerCase();

// Platform yönetici panelinin bulunduğu yol öneki
const ADMIN_PREFIX = "/admin";
// Kiracı yönetim panelinin bulunduğu yol öneki
const PANEL_PREFIX = "/panel";
// Normal müşterinin "Siparişlerim" paneli (demo modunda aktif)
const CUSTOMER_PREFIX = "/musteri";

// Platform (apex) alanının bilinen parçaları — subdomain olarak değerlendirilmez.
const PLATFORM_SUFFIXES = ["onrender.com", "vercel.app", "localhost"];

function resolveShopSlug(hostname: string): string | null {
  const host = hostname.replace(/\.$/, "").toLowerCase();
  if (!host) return null;

  // 1) Açıkça tanımlı kök alan adı (örn. NEXT_PUBLIC_ROOT_DOMAIN=panel.tivarto.com)
  if (rootHost && host.endsWith(`.${rootHost}`)) {
    return host.slice(0, -(rootHost.length + 1)) || null;
  }

  // 2) Kök alan adı tanımlı değilse (Render'ın *.onrender.com adresi gibi)
  //    ilk etiketi yine de vitrin adresi olarak kabul etmeyelim: platform
  //    alanlarında subdomain özelliği kapalıdır.
  if (PLATFORM_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))) {
    return null;
  }

  return null;
}

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase();
  const hostname = host.split(":")[0];
  const url = req.nextUrl.clone();
  const { pathname } = url;

  const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  const isPanelRoute =
    pathname === PANEL_PREFIX || pathname.startsWith(`${PANEL_PREFIX}/`);
  const isAdminRoute =
    pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
  const isCustomerRoute =
    pathname === CUSTOMER_PREFIX || pathname.startsWith(`${CUSTOMER_PREFIX}/`);

  // Çıkış rotası her zaman erişilebilir olmalı; aksi halde süresi dolmuş
  // oturumlar /login'e yönlendirilip çerez hiç temizlenmez (sonsuz döngü).
  const isLogoutRoute = pathname === "/logout";

  // ---- CSRF: server action isteklerinde Origin/Host uyumu ----
  // Next.js'in önerdiği savunma: yabancı bir kaynaktan gelen POST action'ları
  // reddedilir. `Origin` hiç yoksa (ör. bazı sunucu-sunucu çağrıları) istek
  // engellenmez; varlığında ise host ile eşleşmesi şarttır.
  const origin = req.headers.get("origin");
  if (origin && req.method === "POST") {
    let originHost = "";
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = "";
    }
    // Önizleme/proxy ortamlarında Host, kaynak sunucu adı olabilir; tarayıcının
    // gördüğü adres x-forwarded-host ile gelir. İkisini de kabul et.
    const forwardedHost = req.headers.get("x-forwarded-host");
    const allowedHosts = new Set(
      [host, forwardedHost].filter((value): value is string => Boolean(value))
    );
    if (originHost && !allowedHosts.has(originHost)) {
      return new NextResponse("Geçersiz istek kaynağı.", { status: 403 });
    }
  }

  // ---- Kimlik doğrulama kapısı (sadece çerez kontrolü, DB'ye gitmeden) ----
  if (
    (isPanelRoute || isAdminRoute || isCustomerRoute) &&
    !sessionToken &&
    !isLogoutRoute
  ) {
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Zaten giriş yapmış görünen kullanıcıyı login/register'dan kendi paneline
  // yönlendir. Demo oturumunda rol çerezi hangi panelin açılacağını belirtir;
  // gerçek oturumda varsayılan /panel'dir.
  if (sessionToken && (pathname === "/login" || pathname === "/register")) {
    const isDemo = req.cookies.get(DEMO_SESSION_COOKIE)?.value === "1";
    const demoRole = isDemo ? req.cookies.get(DEMO_ROLE_COOKIE)?.value : null;
    url.pathname =
      demoRole === "admin"
        ? "/admin"
        : demoRole === "customer"
          ? "/musteri"
          : "/panel";
    return NextResponse.redirect(url);
  }

  // ---- Subdomain yönlendirme (işletme vitrinleri) ----
  const slug = resolveShopSlug(hostname);
  if (!slug || RESERVED_SLUGS.has(slug)) {
    return NextResponse.next();
  }

  // İşletme vitrini: subdomain'i /shop/[slug] yoluna rewrite et.
  url.pathname = `/shop/${slug}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|uploads).*)",
  ],
};
