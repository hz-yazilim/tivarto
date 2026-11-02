/**
 * Prisma migration dosyalarını (prisma/migrations/<zaman>/migration.sql) sırayla uygular.
 * `prisma migrate deploy` ile aynı işi yapar; tek bağımlılığı `pg`'dir.
 *
 * Neden Prisma Client değil de `pg`?
 *   Migration dosyaları çok sayıda SQL ifadesi içerir ve bunlar tek bir
 *   "simple query" olarak gönderilmelidir. Prisma'nın $executeRawUnsafe'i
 *   prepared statement kullandığı için çok ifadeli SQL'i reddeder.
 *
 * Kullanım: node scripts/migrate.mjs   (DATABASE_URL veya DIRECT_URL gerekir)
 */
import { Client } from "pg";
import fs from "node:fs/promises";
import path from "node:path";

const connectionString =
  process.env.DIRECT_URL || process.env.DATABASE_URL || "";

if (!connectionString) {
  console.error(
    "HATA: DATABASE_URL (veya DIRECT_URL) tanımlı değil. Migration uygulanamaz."
  );
  process.exit(1);
}

async function main() {
  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
  const folders = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (folders.length === 0) {
    console.log("Uygulanacak migration bulunamadı.");
    return;
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "_tivarto_migrations" (
        "name" TEXT PRIMARY KEY,
        "applied_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    for (const folder of folders) {
      const { rowCount } = await client.query(
        `SELECT 1 FROM "_tivarto_migrations" WHERE "name" = $1`,
        [folder]
      );
      if (rowCount && rowCount > 0) {
        console.log(`= ${folder} (zaten uygulanmış)`);
        continue;
      }

      const sql = await fs.readFile(
        path.join(migrationsDir, folder, "migration.sql"),
        "utf8"
      );

      console.log(`→ ${folder} uygulanıyor...`);
      // Her migration kendi transaction'ında: yarıda kalan şema bırakmaz.
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          `INSERT INTO "_tivarto_migrations" ("name") VALUES ($1)`,
          [folder]
        );
        await client.query("COMMIT");
        console.log(`✓ ${folder} uygulandı.`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    console.log("Tüm migration'lar uygulandı.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Migration hatası:", error.message ?? error);
  process.exitCode = 1;
});
