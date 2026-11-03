import { withPlatform } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/session.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csv(value: unknown): string {
  const raw = value == null ? "" : value instanceof Date ? value.toISOString() : String(value);
  return `"${raw.replace(/"/g, '""').replace(/[\r\n]+/g, " ")}"`;
}

export async function GET() {
  await requirePlatformAdmin();
  const rows = await withPlatform((tx) => tx.platformAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 2000,
  }));
  const header = ["Tarih (UTC)", "Yönetici ID", "İşlem", "Hedef türü", "Hedef ID", "Gerekçe", "Önce", "Sonra"];
  const lines = rows.map((row) => [
    row.createdAt, row.actorId, row.action, row.targetType, row.targetId,
    row.reason, row.beforeData ? JSON.stringify(row.beforeData) : "",
    row.afterData ? JSON.stringify(row.afterData) : "",
  ].map(csv).join(","));
  const body = [header.map(csv).join(","), ...lines].join("\r\n");
  return new Response("\uFEFF" + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="tivarto-platform-audit.csv"',
      "Cache-Control": "no-store",
    },
  });
}
