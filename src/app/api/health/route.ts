import { NextResponse } from "next/server";
import { isDatabaseHealthy } from "@/lib/db";
import { DEMO_ACTIVE } from "@/lib/demo-config";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const database = DEMO_ACTIVE ? false : await isDatabaseHealthy();
  const storage = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  const ok = !DEMO_ACTIVE && database && storage;
  return NextResponse.json({ ok, app: "tivarto", mode: DEMO_ACTIVE ? "demo" : "database", database: DEMO_ACTIVE ? "demo-fake-data" : database ? "up" : "down", storage: storage ? "configured" : "missing", time: new Date().toISOString() }, { status: ok ? 200 : 503 });
}
