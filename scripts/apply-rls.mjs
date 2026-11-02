/**
 * Row Level Security politikalarını uygular (prisma/rls.sql) ve doğrular.
 *
 * ÖNEMLİ: Bu script yönetici (superuser) bağlantısıyla çalıştırılmalıdır
 * (DIRECT_URL). Uygulama kullanıcısı superuser OLMAMALIDIR; aksi halde
 * PostgreSQL RLS'i tamamen atlar.
 *
 * Kullanım: node scripts/apply-rls.mjs
 */
import { Client } from "pg";
import fs from "node:fs/promises";
import path from "node:path";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "";

if (!connectionString) {
  console.error("HATA: DIRECT_URL (veya DATABASE_URL) tanımlı değil.");
  process.exit(1);
}

const PROTECTED_TABLES = [
  "Membership",
  "StoreSettings",
  "Category",
  "Product",
  "StockMovement",
  "Order",
  "OrderItem",
  "Customer",
  "Supplier",
  "GoodsReceipt",
  "GoodsReceiptItem",
  "AuditLog",
  "Payment",
];

async function main() {
  const sql = await fs.readFile(
    path.join(process.cwd(), "prisma", "rls.sql"),
    "utf8"
  );

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("RLS politikaları uygulandı (prisma/rls.sql).");

    // ---- Doğrulama: eksik politika var mı? ----
    const { rows } = await client.query(
      `SELECT tablename, policyname
         FROM pg_policies
        WHERE schemaname = 'public' AND policyname = 'tenant_isolation'`
    );
    const covered = new Set(rows.map((row) => row.tablename));
    const missing = PROTECTED_TABLES.filter((table) => !covered.has(table));

    if (missing.length > 0) {
      console.warn(
        `UYARI: Şu tablolarda RLS politikası yok: ${missing.join(", ")}`
      );
      process.exitCode = 1;
    } else {
      console.log(`✓ ${PROTECTED_TABLES.length} tabloda tenant_isolation politikası aktif.`);
    }

    // ---- Uyarı: uygulama kullanıcısı superuser ise RLS atlanır ----
    const { rows: superusers } = await client.query(
      `SELECT rolname FROM pg_roles WHERE rolsuper AND rolcanlogin`
    );
    if (superusers.length > 0) {
      console.warn(
        `DİKKAT: Şu giriş yapabilen roller superuser: ${superusers
          .map((row) => row.rolname)
          .join(", ")}. Uygulama bu rollerden biriyle bağlanıyorsa RLS ETKİSİZDİR.`
      );
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("RLS uygulanamadı:", error.message ?? error);
  process.exitCode = 1;
});
