import { DEMO_MODE } from "@/lib/constants";

/**
 * Veritabanı olmadan çalışan demo katmanı açık mı?
 *
 * KURAL (güvenlik için kritik):
 *  - `DEMO_MODE=false` ise KESİNLİKLE kapalı.
 *  - `DATABASE_URL` tanımlıysa kapalı: gerçek veritabanı bağlandığı anda
 *    "her şifreyi kabul et" davranışı otomatik olarak devre dışı kalır.
 *    Böylece canlı ortamda unutulan bir bayrak yüzünden kimlik doğrulama
 *    atlanmaz.
 *  - İstisna: `DEMO_FAKE_DATA=true` açıkça verilirse, DATABASE_URL olsa bile
 *    sahte veri katmanı kullanılır (ör. veritabanı ayarlanmış ama erişilemiyor).
 *
 * Bu dosya SADECE sunucu tarafında import edilir; edge middleware
 * `DATABASE_URL` değerini bundle'a sokmasın diye ayrı tutuldu.
 */
export const DEMO_ACTIVE =
  DEMO_MODE &&
  (process.env.DEMO_FAKE_DATA === "true" || !process.env.DATABASE_URL);
