import { requireTenantContext } from "@/lib/session.server";
import { withTenant } from "@/lib/db";

export const dynamic = "force-dynamic";

function csvCell(value: unknown): string {
  let text = value == null ? "" : value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

export async function GET() {
  const { tenant } = await requireTenantContext();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const orders = await withTenant(tenant.id, (tx) => tx.order.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  }));
  const rows = [
    ["Sipariş ID", "Tarih", "Müşteri", "Telefon", "Durum", "Ürünler", "Toplam TL"],
    ...orders.map((order) => [
      order.id, order.createdAt, order.customerName, order.customerPhone, order.status,
      order.items.map((item) => item.name + " x" + item.quantity).join(" | "), Number(order.total).toFixed(2),
    ]),
  ];
  const csv = "\uFEFF" + rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="tivarto-siparis-raporu.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
