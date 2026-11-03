/**
 * Uygulama için KISITLI (superuser olmayan) bir PostgreSQL rolü oluşturur.
 *
 * Neden gerekli?
 *   PostgreSQL'de superuser ve BYPASSRLS yetkili roller Row Level Security'yi
 *   tamamen atlar. Uygulama, işletme yöneticisinin (DIRECT_URL) hesabıyla
 *   bağlanırsa tenant izolasyonu ETKİSİZ olur.
 *
 * Yapılanlar:
 *   1. APP_DB_USER rolü yoksa oluşturulur (NOSUPERUSER NOBYPASSRLS).
 *   2. Şema ve tablo yetkileri verilir (SELECT/INSERT/UPDATE/DELETE).
 *   3. Gelecekte eklenecek tablolar için varsayılan yetkiler tanımlanır.
 *
 * Kullanım:
 *   DIRECT_URL="postgresql://admin:...@host/db" \
 *   DATABASE_URL="postgresql://tivarto_app:...@...:6543/postgres" \
 *   APP_DB_USER=tivarto_app node scripts/create-app-role.mjs
 *
 * Çıktı olarak uygulamanın kullanması gereken DATABASE_URL'i yazdırır.
 */
import { Client } from "pg";

const adminUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
const appUser = process.env.APP_DB_USER || "tivarto_app";
const appPassword = process.env.APP_DB_PASSWORD || "";

if (!adminUrl) {
  console.error("HATA: DIRECT_URL (yönetici bağlantısı) tanımlı değil.");
  process.exit(1);
}
if (!appPassword) {
  console.error("HATA: APP_DB_PASSWORD tanımlı değil.");
  process.exit(1);
}
if (!/^[a-z_][a-z0-9_]{2,30}$/.test(appUser)) {
  console.error("HATA: APP_DB_USER yalnızca küçük harf, rakam ve _ içerebilir.");
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString: adminUrl });
  await client.connect();

  try {
    const { rows } = await client.query(
      `SELECT 1 FROM pg_roles WHERE rolname = $1`,
      [appUser]
    );

    if (rows.length === 0) {
      // CREATE ROLE/ALTER ROLE ... PASSWORD parametre kabul etmez;
      // format(%I, %L) ile tanımlayıcı ve şifreyi güvenle kaçırıyoruz.
      const { rows: createSql } = await client.query(
        `SELECT format('CREATE ROLE %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD %L', $1::text, $2::text) AS sql`,
        [appUser, appPassword]
      );
      await client.query(createSql[0].sql);
      console.log(`✓ ${appUser} rolü oluşturuldu.`);
    } else {
      console.log(`= ${appUser} rolü zaten var; mevcut parola korunuyor.`);
    }

    // Parola yalnızca açıkça istendiğinde yenilenir. Her deploy'da döndürmek
    // yayındaki eski function'ların bağlantısını kesebilir.
    if (rows.length > 0 && process.env.ROTATE_APP_DB_PASSWORD === "true") {
      await client.query(`SET ROLE "${appUser}"`);
      try {
        const { rows: passwordSql } = await client.query(
          `SELECT format('ALTER ROLE CURRENT_USER WITH PASSWORD %L', $1::text) AS sql`,
          [appPassword]
        );
        await client.query(passwordSql[0].sql);
      } finally {
        await client.query("RESET ROLE");
      }
      console.log(`✓ ${appUser} parolası kontrollü olarak yenilendi.`);
    }

    // Yetkiler (idempotent). Tanımlayıcılar format(%I) ile kaçırılır.
    const grants = [
      `SELECT format('GRANT CONNECT ON DATABASE %I TO %I', $1::text, $2::text)`,
      `SELECT format('GRANT USAGE ON SCHEMA public TO %I', $1::text)`,
      `SELECT format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO %I', $1::text)`,
      `SELECT format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO %I', $1::text)`,
      `SELECT format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I', $1::text)`,
      `SELECT format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO %I', $1::text)`,
    ];
    for (const template of grants) {
      const params = template.includes("$2") ? [client.database, appUser] : [appUser];
      const { rows } = await client.query(template, params);
      await client.query(rows[0].format);
    }

    // Bilgi: rolün hâlâ superuser/BYPASSRLS olmadığını doğrula.
    const { rows: check } = await client.query(
      `SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = $1`,
      [appUser]
    );
    if (check[0]?.rolsuper || check[0]?.rolbypassrls) {
      throw new Error(
        `${appUser} hâlâ superuser/BYPASSRLS yetkisine sahip — RLS etkisiz olur.`
      );
    }

    console.log(`✓ ${appUser} için yetkiler verildi (RLS etkin).`);

    // Parolalı bağlantı adresini build loglarına yazdırma.
    console.log(`✓ ${appUser} rolü doğrulandı. Uygulama bağlantısı Vercel'de ayrı bir gizli değişken olarak tanımlanmalıdır.`);

  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Rol oluşturulamadı:", error.message ?? error);
  process.exitCode = 1;
});
