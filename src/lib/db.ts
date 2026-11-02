import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Tek Prisma istemcisi (dev'de hot-reload sırasında yeniden oluşmasın diye globalde tutulur).
 * Uygulamanın her yerinde bu dosyadan import edilmelidir.
 *
 * NEDEN DRIVER ADAPTER?
 *   Şema `engineType = "client"` kullanır: sorgular WASM query compiler ile
 *   derlenir ve `pg` sürücüsü üzerinden çalıştırılır. Böylece:
 *     * deploy sırasında platforma özel native "query engine" ikilisi indirilmez
 *       (Render build'inde motor indirme hataları yaşanmaz),
 *     * tek sürücü (`pg`) hem migration scriptlerinde hem uygulamada kullanılır.
 *   Bu bir geliştirme hilesi DEĞİLDİR; üretimde de aynı yol kullanılır.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // Uygulama açılışta patlamasın: hata yalnızca sorgu anında ortaya çıksın.
    // (/api/health bu durumda 503 döner.)
    console.error("DATABASE_URL tanımlı değil — veritabanı sorguları çalışmayacak.");
  }

  const adapter = new PrismaPg({ connectionString: connectionString ?? "" });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Transaction içinde kullanılabilen istemci tipi.
 * DİKKAT: `$transaction` callback'ine gelen nesne tam bir PrismaClient değildir,
 * bu yüzden callback parametresi `Prisma.TransactionClient` olarak tiplenmelidir.
 * (Render'daki "Type 'any[]' is not assignable to type 'T'" hatasının kaynağı buydu.)
 */
export type TenantTx = Prisma.TransactionClient;

/**
 * Tenant verisine dokunan HER sorgu bunun içinden geçmeli.
 * Veritabanına "bu istek hangi işletmeye ait" bilgisini verir,
 * RLS politikaları sadece o işletmenin satırlarını gösterir.
 */
export async function withTenant<T>(
  tenantId: string,
  fn: (tx: TenantTx) => Promise<T>
): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      // `true` => ayar sadece bu transaction için geçerli (connection pool güvenli).
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
      return fn(tx);
    },
    {
      // RLS + çok adımlı işlemler için makul bir üst sınır.
      maxWait: 10_000,
      timeout: 20_000,
    }
  );
}

/**
 * PLATFORM yöneticisi bağlamı: RLS politikalarındaki `app.platform = 'on'`
 * bayrağını set eder; böylece merkez panel tüm işletmelerin satırlarını görebilir.
 * Sadece `requirePlatformAdmin()` ile doğrulanmış isteklerde kullanılmalıdır.
 */
export async function withPlatform<T>(fn: (tx: TenantTx) => Promise<T>): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.platform', ${"on"}, true)`;
      return fn(tx);
    },
    { maxWait: 10_000, timeout: 20_000 }
  );
}

/** Veritabanı erişilebilir mi? (health check için) */
export async function isDatabaseHealthy(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
