import { NextResponse } from "next/server";
import { isDatabaseHealthy } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const database = await isDatabaseHealthy();
  return NextResponse.json(
    {
      ok: database,
      app: "tivarto",
      database: database ? "up" : "down",
      time: new Date().toISOString(),
    },
    { status: database ? 200 : 503 }
  );
}
