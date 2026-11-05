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
  "SupportTicket",
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

    // ---- Tenant tablolarında politika doğrulaması ----
    const { rows } = await client.query(
      `SELECT tablename, policyname
         FROM pg_policies
        WHERE schemaname = 'public' AND policyname = 'tenant_isolation'`
    );
    const covered = new Set(rows.map((row) => row.tablename));
    const missing = PROTECTED_TABLES.filter((table) => !covered.has(table));

    if (missing.length > 0) {
      console.error(
        `HATA: Şu tablolarda tenant_isolation politikası yok: ${missing.join(", ")}`
      );
      process.exitCode = 1;
    } else {
      console.log(`✓ ${PROTECTED_TABLES.length} tabloda tenant_isolation politikası aktif.`);
    }

    // ---- Hesap silme talepleri yalnızca uygulama rolüne açık olmalı ----
    const appUser = process.env.APP_DB_USER || "tivarto_app";
    const { rows: deletionSecurity } = await client.query(
      `SELECT c.relrowsecurity, c.relforcerowsecurity,
              EXISTS (
                SELECT 1 FROM pg_policies p
                 WHERE p.schemaname = 'public'
                   AND p.tablename = 'AccountDeletionRequest'
                   AND p.policyname = 'account_deletion_app_access'
              ) AS app_policy,
              has_table_privilege($1, 'public."AccountDeletionRequest"', 'SELECT') AS app_select,
              has_table_privilege($1, 'public."AccountDeletionRequest"', 'INSERT') AS app_insert,
              has_table_privilege('anon', 'public."AccountDeletionRequest"', 'SELECT') AS anon_select,
              has_table_privilege('authenticated', 'public."AccountDeletionRequest"', 'SELECT') AS authenticated_select
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'AccountDeletionRequest'`,
      [appUser]
    );
    const deletion = deletionSecurity[0];
    if (
      !deletion ||
      !deletion.relrowsecurity ||
      !deletion.relforcerowsecurity ||
      !deletion.app_policy ||
      !deletion.app_select ||
      !deletion.app_insert ||
      deletion.anon_select ||
      deletion.authenticated_select
    ) {
      console.error("HATA: AccountDeletionRequest RLS/uygulama rolü erişim doğrulaması başarısız.");
      process.exitCode = 1;
    } else {
      console.log(`✓ AccountDeletionRequest yalnızca ${appUser} uygulama rolü üzerinden erişilebilir.`);
    }

    // ---- Doğrudan uygulamanın kullandığı rolü doğrula ----
    const { rows: appRoles } = await client.query(
      `SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = $1`,
      [appUser]
    );
    if (appRoles.length === 0) {
      console.error(`HATA: Uygulama rolü bulunamadı: ${appUser}`);
      process.exitCode = 1;
    } else if (appRoles[0].rolsuper || appRoles[0].rolbypassrls) {
      console.error(`${appUser} superuser/BYPASSRLS yetkisine sahip; tenant izolasyonu atlanabilir.`);
      process.exitCode = 1;
    } else {
      console.log(`✓ ${appUser} giriş rolü superuser değil ve RLS'yi atlayamıyor.`);
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("RLS uygulanamadı:", error.message ?? error);
  process.exitCode = 1;
});
