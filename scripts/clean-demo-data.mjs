/**
 * Yalnızca eski seed.mjs tarafından üretilen sabit demo kayıtlarını temizler.
 * Varsayılan davranış DRY-RUN'dır. Gerçek silme için:
 * CONFIRM_DEMO_CLEANUP=DELETE_DEMO_DATA npm run db:clean-demo
 * DIRECT_URL / DATABASE_URL gerekir. Başka tenant veya kullanıcıya dokunmaz.
 */
import { Client } from "pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
if (!connectionString) throw new Error("DIRECT_URL veya DATABASE_URL gerekli.");
const client = new Client({ connectionString });
await client.connect();

try {
  const tenantResult = await client.query('SELECT id FROM "Tenant" WHERE slug = $1', ["demo"]);
  const tenantId = tenantResult.rows[0]?.id;
  const emails = ["admin@tiverto.dev", "demo@tiverto.dev"];
  const userResult = await client.query('SELECT id, email FROM "User" WHERE email = ANY($1::text[])', [emails]);
  if (!tenantId && userResult.rowCount === 0) {
    console.log("Temizlenecek eski demo kaydı bulunamadı.");
    process.exit(0);
  }

  const counts = {};
  if (tenantId) {
    const tables = ["SupportTicket", "GoodsReceiptItem", "GoodsReceipt", "OrderItem", "Order", "StockMovement", "AuditLog", "Payment", "Product", "Category", "Customer", "Supplier", "StoreSettings", "Membership"];
    for (const table of tables) {
      const result = await client.query(`SELECT count(*)::int AS count FROM "${table}" WHERE "tenantId" = $1`, [tenantId]);
      counts[table] = result.rows[0].count;
    }
  }
  counts.Tenant = tenantId ? 1 : 0;
  counts.DemoUsers = userResult.rowCount;
  console.log("Bulunan demo kayıtları:", JSON.stringify(counts));

  if (process.env.CONFIRM_DEMO_CLEANUP !== "DELETE_DEMO_DATA") {
    console.log("DRY-RUN: hiçbir kayıt silinmedi. Silmek için CONFIRM_DEMO_CLEANUP=DELETE_DEMO_DATA ile tekrar çalıştırın.");
    process.exit(0);
  }

  await client.query("BEGIN");
  if (tenantId) {
    const tables = ["SupportTicket", "GoodsReceiptItem", "GoodsReceipt", "OrderItem", "Order", "StockMovement", "AuditLog", "Payment", "Product", "Category", "Customer", "Supplier", "StoreSettings", "Membership"];
    for (const table of tables) await client.query(`DELETE FROM "${table}" WHERE "tenantId" = $1`, [tenantId]);
    await client.query('DELETE FROM "Tenant" WHERE id = $1 AND slug = $2', [tenantId, "demo"]);
  }
  const userIds = userResult.rows.map((row) => row.id);
  if (userIds.length) {
    await client.query('DELETE FROM "Session" WHERE "userId" = ANY($1::text[])', [userIds]);
    await client.query('DELETE FROM "User" u WHERE u.id = ANY($1::text[]) AND NOT EXISTS (SELECT 1 FROM "Membership" m WHERE m."userId" = u.id)', [userIds]);
  }
  await client.query("COMMIT");
  console.log("Eski seed kaynaklı demo işletme ve demo hesap kayıtları temizlendi.");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  await client.end();
}
