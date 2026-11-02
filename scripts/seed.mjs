/**
 * Demo verisi oluşturur (idempotent — tekrar çalıştırılabilir).
 *
 * Oluşturulan hesaplar:
 *   Platform yöneticisi : admin@tiverto.dev   / Tiverto!2026
 *   Demo işletme sahibi : demo@tiverto.dev    / Tiverto!2026
 *   Demo vitrin         : /shop/demo
 *
 * ⚠️ Bu bilgiler DEMO amaçlıdır. Canlı ortamda mutlaka değiştirin
 *    (DEMO_MODE=false iken seed çalıştırılmaz).
 *
 * NOT: Uygulama, Row Level Security (RLS) açık bir PostgreSQL rolüyle
 * bağlanır. Tüm yazma işlemleri "platform" bağlamı ayarlanmış TEK bir
 * transaction içinde yapılır; aksi halde RLS INSERT'leri reddeder.
 *
 * Kullanım: node scripts/seed.mjs   (DATABASE_URL gerekir)
 */
import { Client } from "pg";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL || "";
const PASSWORD = process.env.SEED_PASSWORD || "Tiverto!2026";
const DEMO_SLUG = "demo";
const DEMO_EMAIL = "demo@tiverto.dev";
const ADMIN_EMAIL = "admin@tiverto.dev";

const id = () => crypto.randomUUID();

if (!connectionString) {
  console.error("HATA: DATABASE_URL tanımlı değil. Seed uygulanamaz.");
  process.exit(1);
}

const PRODUCTS = [
  { name: "Pul Biber 100 g", sellPrice: 45.5, buyPrice: 30, stock: 24, minStock: 5 },
  { name: "Karabiber 50 g", sellPrice: 32, buyPrice: 21, stock: 3, minStock: 5 },
  { name: "Kimyon 100 g", sellPrice: 28.75, buyPrice: 18, stock: 0, minStock: 4 },
  { name: "Nane 50 g", sellPrice: 19.9, buyPrice: 12, stock: 40, minStock: 10 },
  { name: "Tarçın 100 g", sellPrice: 34, buyPrice: 22, stock: 12, minStock: 6 },
];

async function main() {
  if (process.env.DEMO_MODE === "false") {
    console.log("DEMO_MODE=false → seed atlandı.");
    return;
  }

  // bcrypt hash'i transaction dışında hesaplanır (transaction'ı kısa tutar).
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const client = new Client({ connectionString });
  await client.connect();

  let addedProducts = 0;

  try {
    await client.query("BEGIN");
    // RLS bağlamı: platform yöneticisi tüm işletmeleri görür/yazar.
    await client.query("SELECT set_config('app.platform', 'on', true)");

    // ---- Plan (yoksa oluştur) ----
    await client.query(
      `INSERT INTO "Plan" (id, name, "priceMonthly", "maxProducts", "maxStorageMb")
       SELECT $1, 'Başlangıç', 399, 500, 5000
        WHERE NOT EXISTS (SELECT 1 FROM "Plan" WHERE name = 'Başlangıç')`,
      [id()]
    );
    const { rows: planRows } = await client.query(
      `SELECT id FROM "Plan" WHERE name = 'Başlangıç' LIMIT 1`
    );
    const planId = planRows[0].id;

    // ---- Platform yöneticisi ----
    await client.query(
      `INSERT INTO "User" (id, email, "passwordHash", name, "isPlatformAdmin")
       VALUES ($1, $2, $3, 'Platform Yöneticisi', true)
       ON CONFLICT (email) DO UPDATE SET "isPlatformAdmin" = true`,
      [id(), ADMIN_EMAIL, passwordHash]
    );

    // ---- Demo işletme sahibi ----
    await client.query(
      `INSERT INTO "User" (id, email, "passwordHash", name)
       VALUES ($1, $2, $3, 'Demo İşletme Sahibi')
       ON CONFLICT (email) DO NOTHING`,
      [id(), DEMO_EMAIL, passwordHash]
    );
    const { rows: userRows } = await client.query(
      `SELECT id FROM "User" WHERE email = $1`,
      [DEMO_EMAIL]
    );
    const userId = userRows[0].id;

    // ---- Demo işletme ----
    await client.query(
      `INSERT INTO "Tenant" (id, slug, name, status, "planId")
       VALUES ($1, $2, 'Demo Baharat', 'ACTIVE', $3)
       ON CONFLICT (slug) DO NOTHING`,
      [id(), DEMO_SLUG, planId]
    );
    const { rows: tenantRows } = await client.query(
      `SELECT id FROM "Tenant" WHERE slug = $1`,
      [DEMO_SLUG]
    );
    const tenantId = tenantRows[0].id;

    // İşletme bağlamı: aşağıdaki satırlar bu tenant'a yazılır.
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);

    // ---- Üyelik ----
    await client.query(
      `INSERT INTO "Membership" (id, "tenantId", "userId", role)
       SELECT $1, $2, $3, 'OWNER'
        WHERE NOT EXISTS (
          SELECT 1 FROM "Membership" WHERE "tenantId" = $2 AND "userId" = $3
        )`,
      [id(), tenantId, userId]
    );

    // ---- Mağaza ayarları ----
    await client.query(
      `INSERT INTO "StoreSettings" (id, "tenantId", description, phone, whatsapp, address, theme)
       VALUES ($1, $2, $3, $4, $5, $6, 'default')
       ON CONFLICT ("tenantId") DO NOTHING`,
      [
        id(),
        tenantId,
        "Demo mağazası — örnek baharat ve baharat karışımları. Gerçek satış yapılmaz.",
        "0212 000 00 00",
        "905321234567",
        "Örnek Mah. Demo Sok. No:1, İstanbul",
      ]
    );

    // ---- Kategoriler ----
    for (const [index, name] of ["Baharat", "Karışım", "İçecek"].entries()) {
      await client.query(
        `INSERT INTO "Category" (id, "tenantId", name, "sortOrder")
         SELECT $1, $2, $3, $4
          WHERE NOT EXISTS (
            SELECT 1 FROM "Category" WHERE "tenantId" = $2 AND name = $3
          )`,
        [id(), tenantId, name, index + 1]
      );
    }

    // ---- Ürünler (yalnızca hiç ürün yoksa) ----
    const { rows: productCountRows } = await client.query(
      `SELECT count(*)::int AS count FROM "Product" WHERE "tenantId" = $1`,
      [tenantId]
    );
    if (productCountRows[0].count === 0) {
      const { rows: categoryRows } = await client.query(
        `SELECT id FROM "Category" WHERE "tenantId" = $1 AND name = 'Baharat' LIMIT 1`,
        [tenantId]
      );
      const categoryId = categoryRows[0]?.id ?? null;

      for (const product of PRODUCTS) {
        await client.query(
          `INSERT INTO "Product"
             (id, "tenantId", "categoryId", name, "sellPrice", "buyPrice",
              stock, "minStock", "isActive", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, now())`,
          [
            id(),
            tenantId,
            categoryId,
            product.name,
            product.sellPrice,
            product.buyPrice,
            product.stock,
            product.minStock,
          ]
        );
      }
      addedProducts = PRODUCTS.length;
    }

    // ---- Denetim kaydı ----
    await client.query(
      `INSERT INTO "AuditLog" (id, "tenantId", action, entity, "entityId")
       VALUES ($1, $2, 'seed.run', 'Tenant', $2)`,
      [id(), tenantId]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }

  console.log("Seed tamamlandı.");
  if (addedProducts > 0) console.log(`  ${addedProducts} demo ürün eklendi.`);
  console.log(`  Yönetici : ${ADMIN_EMAIL} / ${PASSWORD}`);
  console.log(`  İşletme  : ${DEMO_EMAIL} / ${PASSWORD}`);
  console.log(`  Vitrin   : /shop/${DEMO_SLUG}`);
}

main().catch((error) => {
  console.error("Seed hatası:", error.message ?? error);
  process.exitCode = 1;
});
