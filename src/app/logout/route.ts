export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySession, SESSION_COOKIE_NAME } from "@/lib/auth";
import { DEMO_COOKIE_NAMES } from "@/lib/demo-session.server";

/**
 * Oturumu kapatır. Route handler içinde redirect() yerine NextResponse kullanılır
 * (cookie silme + yönlendirme aynı yanıtta yapılmalı).
 */
export async function GET(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await destroySession(token).catch(() => {});
  }

  const url = new URL("/login", req.url);
  const response = NextResponse.redirect(url);
  const clearOptions = {
    httpOnly: false,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  };
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...clearOptions,
    httpOnly: true,
  });
  for (const name of DEMO_COOKIE_NAMES) {
    response.cookies.set(name, "", clearOptions);
  }
  return response;
}
