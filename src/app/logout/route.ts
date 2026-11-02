export const runtime = "nodejs";

import { redirect } from "next/navigation";
import { logoutAction } from "@/actions/auth";

export async function GET() {
  await logoutAction();
  redirect("/login");
}
