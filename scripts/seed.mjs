/**
 * İlk platform yöneticisini güvenli biçimde oluşturur/günceller.
 *
 * Gerekli ortam değişkenleri: DATABASE_URL veya DIRECT_URL,
 * BOOTSTRAP_ADMIN_EMAIL ve en az 14 karakterli BOOTSTRAP_ADMIN_PASSWORD.
 * Örnek işletme, müşteri, ürün, sipariş veya tahsilat verisi üretmez.
 * İşlemden sonra BOOTSTRAP_ADMIN_PASSWORD değişkenini kaldırın.
 */
import { Client } from "pg";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
const email = (process.env.BOOTSTRAP_ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || "";

if (!connectionString) throw new Error("DATABASE_URL veya DIRECT_URL gerekli.");
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("Geçerli BOOTSTRAP_ADMIN_EMAIL gerekli.");
}
if (password.length < 14) {
  throw new Error("BOOTSTRAP_ADMIN_PASSWORD en az 14 karakter olmalı.");
}

const passwordHash = await bcrypt.hash(password, 12);
const client = new Client({ connectionString });
await client.connect();

try {
  await client.query("BEGIN");
  const userId = crypto.randomUUID();
  const result = await client.query(
    `INSERT INTO "User" (id, email, "passwordHash", name, "isPlatformAdmin", "isSuspended")
     VALUES ($1, $2, $3, 'Platform Yöneticisi', true, false)
     ON CONFLICT (email) DO UPDATE
       SET "passwordHash" = EXCLUDED."passwordHash",
           "isPlatformAdmin" = true,
           "isSuspended" = false
     RETURNING id`,
    [userId, email, passwordHash]
  );
  await client.query('DELETE FROM "Session" WHERE "userId" = $1', [result.rows[0].id]);
  await client.query("COMMIT");
  console.log(`Platform yöneticisi hazır: ${email}. Önceki oturumlar güvenlik için kapatıldı.`);
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  await client.end();
}
