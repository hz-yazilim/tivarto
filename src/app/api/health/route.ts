import { NextResponse } from "next/server";
import { isDatabaseHealthy } from "@/lib/db";
import { DEMO_ACTIVE } from "@/lib/demo-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // Demo katmanı aktifken veritabanı yoktur; sağlık kontrolü yine de "ayakta"
  // döner ama bunun gerçek bir DB kontrolü olmadığı açıkça belirtilir.
  const database = DEMO_ACTIVE ? true : await isDatabaseHealthy();
  return NextResponse.json(
    {
      ok: database,
      app: "tivarto",
      mode: DEMO_ACTIVE ? "demo" : "database",
      database: DEMO_ACTIVE ? "demo-fake-data" : database ? "up" : "down",
      time: new Date().toISOString(),
    },
    { status: database ? 200 : 503 }
  );
}
