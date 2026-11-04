/**
 * İlk platform yöneticisini güvenli biçimde oluşturur/günceller.
 *
 * Gerekli ortam değişkenleri: DATABASE_URL veya DIRECT_URL,
 * BOOTSTRAP_ADMIN_EMAIL ve en az 8 karakterli BOOTSTRAP_ADMIN_PASSWORD.
 * Örnek işletme, müşteri, ürün, sipariş veya tahsilat verisi üretmez.
 * İşlemden sonra BOOTSTRAP_ADMIN_PASSWORD değişkenini kaldırın.
 */
import { Client } from "pg";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
const ADMIN_EMAIL = "hz.yazilimm@gmail.com";
const email = (process.env.BOOTSTRAP_ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || "";

if (!connectionString) throw new Error("DATABASE_URL veya DIRECT_URL gerekli.");
if (email !== ADMIN_EMAIL) {
  throw new Error(`Tivarto platform yöneticisi yalnızca ${ADMIN_EMAIL} olabilir.`);
}
if (password.length < 8) {
  throw new Error("BOOTSTRAP_ADMIN_PASSWORD en az 8 karakter olmalı.");
}

const client = new Client({ connectionString });
await client.connect();

try {
  await client.query("BEGIN");
  const existing = await client.query(
    'SELECT id, "isPlatformAdmin" FROM "User" WHERE email = $1',
    [email]
  );
  let adminId;
  if (existing.rows.length > 0) {
    if (!existing.rows[0].isPlatformAdmin) {
      throw new Error("Bu e-posta zaten platform yöneticisi olmayan bir kullanıcıya ait. Otomatik olarak üzerine yazılmadı.");
    }
    adminId = existing.rows[0].id;
    console.log("Platform yöneticisi zaten mevcut; mevcut şifre ve oturumlar korundu.");
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = crypto.randomUUID();
    const result = await client.query(
      `INSERT INTO "User" (id, email, "passwordHash", name, "isPlatformAdmin", "isSuspended", "mustChangePassword")
       VALUES ($1, $2, $3, 'Platform Yöneticisi', true, false, true)
       RETURNING id`,
      [userId, email, passwordHash]
    );
    adminId = result.rows[0].id;
    console.log(`Platform yöneticisi oluşturuldu: ${email}. İlk girişte şifre değişimi zorunlu.`);
  }
  await client.query("COMMIT");
  console.log("Platform yöneticisi doğrulandı; mevcut oturumlara dokunulmadı.");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  await client.end();
}
