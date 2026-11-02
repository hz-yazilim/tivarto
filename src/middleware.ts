import { NextRequest, NextResponse } from "next/server";
import { RESERVED_SLUGS } from "@/lib/reserved";
import { validateSession, SESSION_COOKIE_NAME } from "@/lib/auth";

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";
const rootHost = ROOT.split(":")[0];

// Platform yönetici panelinin bulunduğu yol öneki
const ADMIN_PREFIX = "/admin";
// Kiracı yönetim panelinin bulunduğu yol öneki
const PANEL_PREFIX = "/panel";

export async function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase();
  const url = req.nextUrl.clone();
  const hostname = host.split(":")[0];

  const { pathname } = url;

  // ---- Kimlik doğrulama koruması (panel ve admin) ----
  const isPanelRoute = pathname === PANEL_PREFIX || pathname.startsWith(`${PANEL_PREFIX}/`);
  const isAdminRoute = pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
  const isAuthRoute =
    pathname === "/login" || pathname === "/register" || pathname.startsWith("/api/");

  const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if ((isPanelRoute || isAdminRoute) && !isAuthRoute) {
    if (!sessionToken) {
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    // Session'ı doğrula (sadece korumalı rotalar için tek bir DB sorgusu).
    const session = await validateSession(sessionToken);
    if (!session) {
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    // Yönetici paneli sadece platform admini için.
    if (isAdminRoute && !session.user.isPlatformAdmin) {
      return new NextResponse(null, { status: 403 });
    }

    return NextResponse.next();
  }

  // Zaten giriş yapmışsa login/register sayfalarından panel'e yönlendir.
  if (sessionToken && (pathname === "/login" || pathname === "/register")) {
    const session = await validateSession(sessionToken);
    if (session) {
      url.pathname = session.user.isPlatformAdmin ? "/admin" : "/panel";
      return NextResponse.redirect(url);
    }
  }

  // ---- Subdomain yönlendirme (işletme vitrinleri) ----
  // abcbaharat.platform.com -> "abcbaharat"
  let slug: string | null = null;
  if (hostname.endsWith("." + rootHost) && hostname !== rootHost) {
    slug = hostname.slice(0, -(rootHost.length + 1));
  }

  // Ana site, panel, api, reserved: olduğu gibi devam
  if (!slug || RESERVED_SLUGS.has(slug)) {
    return NextResponse.next();
  }

  // İşletme vitrini: /shop/[slug]/... yoluna yönlendir
  url.pathname = `/shop/${slug}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico|manifest.webmanifest|icons|uploads).*)",
  ],
};
