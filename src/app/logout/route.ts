export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySession, SESSION_COOKIE_NAME } from "@/lib/auth";

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
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
  return response;
}
