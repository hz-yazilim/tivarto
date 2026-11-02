import { NextRequest, NextResponse } from "next/server";
import { RESERVED_SLUGS } from "@/lib/reserved";

const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase();
  const url = req.nextUrl.clone();

  // abcbaharat.platform.com -> "abcbaharat"
  const rootHost = ROOT.split(":")[0];
  const hostname = host.split(":")[0];

  let slug: string | null = null;
  if (hostname.endsWith("." + rootHost)) {
    slug = hostname.slice(0, -(rootHost.length + 1));
  }

  // Ana site, panel, api: olduğu gibi devam
  if (!slug || RESERVED_SLUGS.has(slug)) {
    return NextResponse.next();
  }

  // İşletme vitrini: /shop/[slug]/... yoluna yönlendir
  url.pathname = `/shop/${slug}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|manifest.webmanifest|icons).*)"],
};
