import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DEMO_ACTIVE } from "@/lib/demo-config";
import { createDemoClient } from "@/lib/demo-client";

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
  const configuredUrl = process.env.DATABASE_URL ?? "";
  const appPassword = process.env.APP_DB_PASSWORD;
  const appUser = process.env.APP_DB_USER || "tivarto_app";
  let connectionString = configuredUrl;

  // Üretim kurulumunda app rolünün parolası APP_DB_PASSWORD ile yönetilir.
  // DATABASE_URL içindeki eski parola build sırasında değişmiş olabilir;
  // runtime bağlantısını aynı gizli parola ile eşitle.
  if (configuredUrl && appPassword) {
    try {
      const parsed = new URL(configuredUrl);
      if (decodeURIComponent(parsed.username) === appUser) {
        parsed.password = appPassword;
        connectionString = parsed.toString();
      }
    } catch {
      console.error("DATABASE_URL geçerli bir PostgreSQL URL biçiminde değil.");
    }
  }

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

/**
 * DEMO MODU: `DATABASE_URL` yokken gerçek PrismaClient oluşturmak yerine bellek
 * içi örnek veri istemcisi kullanılır. Böylece paneller veritabanı bağlantısı
 * kurulmadan da gezilebilir. Veritabanı bağlandığında (DATABASE_URL tanımlı
 * veya DEMO_MODE=false) bu dal tamamen devre dışı kalır ve gerçek istemci
 * kullanılır; demo giriş kısayolu da otomatik olarak kapanır.
 */
export const prisma: PrismaClient = DEMO_ACTIVE
  ? (createDemoClient() as unknown as PrismaClient)
  : (globalForPrisma.prisma ?? createClient());

if (!DEMO_ACTIVE && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

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
