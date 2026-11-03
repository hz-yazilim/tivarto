# Tiverto

> **İşletmeni yönet, ticaretini büyüt.**

Tiverto; küçük ve orta ölçekli işletmelerin ürünlerini, stoklarını, müşterilerini,
tedarikçilerini ve siparişlerini tek bir platform üzerinden yönetebilmesi için
geliştirilen **bulut tabanlı işletme yönetim platformudur**.

Her işletme kendi yönetim panelini (`/panel`) ve otomatik güncellenen herkese açık
internet vitrinini (`/shop/[slug]`) kullanır. Platform sahibi ayrıca merkez yönetim
panelinden (`/admin`) işletmeleri, paketleri ve ödemeleri yönetir.

---

## 1. Hızlı bakış

| | |
|---|---|
| **Teknoloji** | Next.js 15 (App Router, React 19), TypeScript, Tailwind CSS, Prisma ORM (WASM query compiler + `pg`), PostgreSQL |
| **Kimlik doğrulama** | E-posta + şifre (bcrypt), sunucu tarafı oturum (httpOnly cookie + `Session` tablosu) |
| **Veri izolasyonu** | PostgreSQL **Row Level Security (RLS)** + her sorguda `app.tenant_id` bağlamı |
| **Yayınlama** | GitHub → Render (Blueprint: `render.yaml`) |
| **Durum** | Aşama 2 tamamlandı (veritabanı + kullanıcı sistemi), Aşama 3 devam ediyor |

### Roller

| Rol | Giriş sonrası | Yetkiler |
|---|---|---|
| `isPlatformAdmin = true` | `/admin` | Tüm işletmeler, planlar, ödemeler, loglar |
| İşletme sahibi (`OWNER`) | `/panel` | Kendi işletmesinin tüm modülleri |
| Personel (`STAFF`) | `/panel` | Kendi işletmesinin modülleri (rol ayrımı genişletilecek) |
| Müşteri (demo) | `/musteri` | Siparişlerim + `/shop/demo` vitrininden alışveriş |
| Anonim | `/`, `/login`, `/register`, `/shop/[slug]` | Vitrinden sipariş verebilir |

> **Demo hızlı giriş:** Demo katmanı açıkken (`DATABASE_URL` tanımlı değilse)
> `/login` ekranında şifreyle giriş geçici olarak kapalıdır. Bir panel rolüne
> tıklayarak e-posta veya şifre girmeden **Platform Yöneticisi / İşletme
> Yetkilisi / Müşteri** olarak devam edebilirsiniz. Ana sayfadan da tek tıkla
> panele geçiş yapılabilir. Demo modunda `/register` de doğrudan örnek işletme
> paneline giriş sunar; veritabanı olmadığı için gerçek hesap oluşturmaz.
> Veritabanı bağlandığında demo girişi kapanır ve normal e-posta/şifre girişi
> otomatik olarak devreye girer.

---

## 2. Proje durumu (dürüst özet)

### ✅ Çalışıyor

- Kayıt / giriş / çıkış, oturum yönetimi (30 gün, tek kullanımlık token, DB'de saklanır)
- İşletme (tenant) oluşturma, plan ataması, mağaza ayarları
- Ürün ve kategori yönetimi (görsel yükleme dahil)
- Stok yönetimi (giriş/çıkış/sayım düzeltmesi, hareket geçmişi, kritik stok)
- Mal kabul (tedarikçi, eksik/hasarlı miktar; sağlam miktar stoğa eklenir)
- Müşteri ve tedarikçi kayıtları
- Sipariş yönetimi + durum takibi (iptalde stok geri eklenir)
- Herkese açık vitrin, sepet, sipariş oluşturma, WhatsApp sipariş özeti
- Merkez yönetim paneli (işletmeler, planlar, ödemeler, denetim kayıtları)
- RLS ile işletmeler arası veri izolasyonu (fail-closed)
- Mobil uyumlu arayüzler
- **Veritabanı olmadan demo katmanı:** örnek verilerle üç panel de gezilebilir,
  giriş bilgileri doğrulanmaz (yalnızca `DATABASE_URL` tanımsızken)

### 🚧 Henüz yok / sıradaki işler

- Görsel için kalıcı depolama (şu an `public/uploads` — Render'ın diski **geçici**)
- Abonelik/ödeme entegrasyonu (şu an yalnızca kayıt tutuluyor, tahsilat yok)
- Şifre sıfırlama, e-posta doğrulama
- Personel davet/rol yönetimi
- Otomatik testler (şu an CI'da tip kontrolü + build var)
- Rate limiting, 2FA, yedekleme otomasyonu

### 🔬 Doğrulanan davranışlar (son test turu)

Aşağıdakiler gerçek PostgreSQL üzerinde, RLS **açık ve zorunlu** kısıtlı bir rolle
(`NOSUPERUSER NOBYPASSRLS`) çalıştırılan uygulamada gözlemlendi:

| Senaryo | Sonuç |
|---|---|
| Giriş yapmamış kullanıcı `/panel` | `307` → `/login` |
| İşletme sahibi `/admin` | `307` → `/panel` |
| A işletmesi B'nin müşterisini/ürününü silmeye çalışır | Veri **değişmez** (RLS satırı gizler) |
| A vitrininden B'nin ürününü sipariş etme | `"Seçilen ürünler artık satışta değil."` |
| Stoktan fazla sipariş | `"… için yeterli stok yok (kalan: N)"` |
| Askıya alınmış işletmenin vitrini | Sipariş reddedilir + "hizmete kapalı" uyarısı |
| Sipariş iptali | Stok geri eklenir (22 → 24), `AuditLog` kaydı düşer |
| Yabancı `Origin`'den POST | `403` |
| Tüm panel/admin sayfaları (14 rota) | `200` |

---

## 3. Kurulum (yerel)

### Gereksinimler

- Node.js **20+** (Render'da 22)
- PostgreSQL **14+**

### Adımlar

```bash
git clone <repo-url> tiverto && cd tiverto
npm install                     # scripts/prisma-generate.mjs istemciyi üretir (ağ gerekmez)

cp .env.example .env            # değerleri doldurun
# DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_ROOT_DOMAIN
```

**Sadece demo olarak bakmak istiyorsan veritabanı kurmana gerek yok:**
`.env` dosyasında `DATABASE_URL` satırını yorum satırı yap (veya hiç ekleme),
ardından `npm run dev`. Uygulama bellek içi örnek veriyle açılır; `/login`
ekranından istediğin bilgilerle veya ana sayfadaki tek tıklık butonlarla üç
paneline de girebilirsin. Demo sırasında eklediğin kayıtlar sunucu yeniden
başlayınca sıfırlanır.

Gerçek veritabanıyla çalışmak için:

```bash
npm run db:migrate:deploy       # migration'ları uygula (init: tüm tablolar)
npm run db:app-role             # kısıtlı uygulama rolü (RLS için şart)
npm run db:rls                  # RLS politikalarını uygula + doğrula
npm run db:seed                 # demo verisi (DEMO_MODE=true ise)

npm run dev                     # http://localhost:3000
```

> `DATABASE_URL` tanımlandığı anda demo giriş kolaylığı otomatik kapanır ve
> gerçek e-posta/şifre doğrulaması devreye girer. Ayrıca `DEMO_MODE=false`
> yapmanız önerilir.

Seed sonrası demo hesaplar (şifre `Tiverto!2026`, `SEED_PASSWORD` ile değiştirilebilir):

| Hesap | E-posta | Panel |
|---|---|---|
| Platform yöneticisi | `admin@tiverto.dev` | `/admin` |
| Demo işletme | `demo@tiverto.dev` | `/panel` |
| Demo vitrin | — | `/shop/demo` |

> ⚠️ **Demo hesapları canlı ortamda mutlaka silin/değiştirin.** `DEMO_MODE=false`
> iken seed çalışmaz.

---

## 4. Ortam değişkenleri

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `DATABASE_URL` | ✅ | Uygulamanın kullandığı bağlantı. **Superuser olmayan** kullanıcı (RLS için şart) |
| `DIRECT_URL` | ✅ | Migration/RLS için doğrudan bağlantı (yönetici kullanıcı) |
| `NEXT_PUBLIC_ROOT_DOMAIN` | ➖ | Vitrin subdomain kökü (`tiverto.app`). Boşsa subdomain yönlendirme kapalıdır; vitrin `/shop/[slug]` üzerinden çalışır |
| `DEMO_MODE` | ➖ | `false` değilse arayüzlerde "Demo" bilgilendirmesi görünür |
| `DEMO_FAKE_DATA` | ➖ | `true` ise `DATABASE_URL` tanımlı olsa bile bellek içi demo verisi kullanılır. **Canlı ortamda asla açmayın** |
| `SEED_PASSWORD` | ➖ | Demo hesapların şifresi |

**Demo katmanının açık olma koşulu:** `DEMO_MODE !== "false"` **VE**
(`DATABASE_URL` tanımlı değil **VEYA** `DEMO_FAKE_DATA === "true"`).
Yani veritabanı bağlandığında "her şifreyi kabul et" davranışı kendiliğinden
kapanır; ek bir kod değişikliği gerekmez.

Hassas değerler **asla** kaynak koduna yazılmaz; yalnızca ortam değişkeni olarak tutulur.

---

## 5. Komutlar

| Komut | Ne yapar |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | `prisma generate` + üretim derlemesi (tip hatalarında **başarısız olur**) |
| `npm run start` | Üretim sunucusu |
| `npm run typecheck` | Sadece TypeScript kontrolü |
| `npm run lint` | ESLint |
| `npm run db:migrate:deploy` | `scripts/migrate.mjs` — bekleyen migration'ları uygular (idempotent) |
| `npm run db:rls` | `prisma/rls.sql` politikalarını uygular **ve doğrular** |
| `npm run db:seed` | Demo verisi (`DEMO_MODE=false` ise atlanır) |
| `npm run db:app-role` | RLS'i **etkin** kılan kısıtlı uygulama rolünü oluşturur |
| `npm run db:setup` | migration + RLS + seed (tek seferde) |
| `npm run db:migrate` | `prisma migrate dev` (yalnızca yerel geliştirme) |

Migration'lar `scripts/migrate.mjs` ile uygulanır. Bu runner `pg` sürücüsünü kullanır
(migration dosyaları çok sayıda SQL ifadesi içerir; Prisma'nın `$executeRawUnsafe`
metodu prepared statement kullandığı için bu dosyaları reddeder). Runner
`_tivarto_migrations` tablosuyla hangi migration'ın uygulandığını takip eder,
böylece her deploy'da tekrar çalıştırılabilir.

---

## 6. Render'da yayınlama

1. Render → **New → Blueprint** → depoyu seç (`render.yaml` okunur).
2. `NEXT_PUBLIC_ROOT_DOMAIN` değerini gir (Render'ın verdiği alan adını kullanacaksan
   boş bırakabilirsin; vitrin `/shop/<slug>` üzerinden çalışır).
3. İlk deploy'da sırasıyla şunlar olur:
   - `npm ci` → bağımlılıklar + `postinstall` ile `prisma generate`
   - `npm run build` → `prisma generate && next build`
   - `npm run db:migrate:deploy && npm run start` → tablolar oluşturulur (idempotent),
     sunucu ayağa kalkar, sağlık kontrolü `/api/health`
   - Migration'lar build yerine **start** aşamasında çalışır; böylece build
     sırasında veritabanına erişilemese bile deploy başarısız olmaz.
4. **RLS'i etkinleştir (kritik).** Render'ın verdiği veritabanı kullanıcısı
   superuser olabilir; superuser RLS'i tamamen atlar. Kısıtlı bir uygulama rolü
   oluşturup `DATABASE_URL`'i bu rolle değiştirin (bir kez, Shell'den):

```bash
# DIRECT_URL = yönetici bağlantısı (Render'ın verdiği connection string)
DIRECT_URL="postgresql://..." \
APP_DB_USER=tiverto_app \
APP_DB_PASSWORD="guclu-bir-sifre" \
npm run db:app-role
# Çıktıdaki DATABASE_URL'i servisin Environment sekmesine yazın ve redeploy edin.

npm run db:rls     # politikaları uygula + doğrula (DIRECT_URL ile)
npm run db:seed    # demo verisi istiyorsan (DEMO_MODE=false ise atlanır)
```

   `npm run db:rls` sonunda "superuser olan giriş yapabilen roller" uyarısı
   görürseniz uygulama o rolle bağlanıyorsa RLS **etkisizdir** — mutlaka
   `tiverto_app` rolüne geçin.

**Önemli:** Render servisinin diski geçicidir. Kalıcı veri **yalnızca** yönetilen
PostgreSQL'de tutulur. `public/uploads` içine yüklenen görseller yeniden deploy'da
kaybolur — kalıcı görsel depolama (S3/R2 vb.) henüz bağlanmadı.

---

## 7. Mimari ve güvenlik

### 7.1 Klasör yapısı

```
prisma/
  schema.prisma            # veri modeli (tenant + platform tabloları)
  migrations/              # SQL migration'ları
  rls.sql                  # RLS politikaları
scripts/
  migrate.mjs              # migration runner (Render)
  apply-rls.mjs            # RLS uygulayıcı
  seed.mjs                 # demo verisi (RLS bağlamı içinde)
  create-app-role.mjs      # kısıtlı (RLS'etkin) uygulama rolü
src/
  app/
    (public)               # /, /login, /register, /hesap-yok, /shop/[slug]
    panel/                 # işletme yönetim paneli (korumalı)
    admin/                 # merkez yönetim paneli (yalnızca platform admin)
    musteri/               # müşteri "Siparişlerim" paneli (demo)
    api/health, api/upload # sağlık kontrolü + görsel yükleme
  actions/                 # server action'lar (mutasyonlar)
  components/              # arayüz bileşenleri
  lib/
    db.ts                  # prisma (pg adapter) + withTenant() + withPlatform()
    auth.ts                # şifre/oturum yardımcıları
    session.server.ts      # oturum + işletme bağlamı (server-only)
    constants.ts           # edge-güvenli sabitler (middleware bunu kullanır)
    demo-config.ts         # DEMO_ACTIVE (sunucu tarafı, güvenlik koşulu)
    demo-data.ts           # demo örnek verisi
    demo-client.ts         # bellek içi Prisma benzeri istemci
    demo-session.server.ts # demo oturum çerezleri / rol geçişi
    validation.ts          # form doğrulama yardımcıları
  middleware.ts            # edge: auth kapısı + subdomain rewriteları
```

### 7.2 İşletmeler arası veri izolasyonu (RLS)

- `Membership`, `StoreSettings`, `Category`, `Product`, `StockMovement`, `Order`,
  `OrderItem`, `Customer`, `Supplier`, `GoodsReceipt`, `GoodsReceiptItem`,
  `AuditLog`, `Payment` tablolarında RLS **açık ve zorunlu** (`FORCE ROW LEVEL SECURITY`).
- Politika **fail-closed**:

| Bağlam | Görünen satırlar |
|---|---|
| `app.tenant_id = <id>` (uygulama: `withTenant`) | Yalnızca o işletme |
| `app.platform = 'on'` (uygulama: `withPlatform`, sadece platform admin) | Tüm işletmeler |
| Hiçbiri | **Hiçbiri** |

- Uygulama bağlantısı **superuser olmamalıdır**; aksi hâlde RLS atlanır.
  Bu yüzden `npm run db:app-role` ile `NOSUPERUSER NOBYPASSRLS` bir rol oluşturulur
  ve uygulama **o rolle** bağlanır (`DIRECT_URL` yalnızca migration/RLS içindir).
- RLS'in gerçekten çalıştığı doğrulandı: bağlamsız sorgu `0` satır, `app.tenant_id`
  yalnızca o işletmenin satırları, `app.platform='on'` tüm işletmeler;
  başka işletmenin satırını yazma girişimi veritabanı tarafından reddedilir (`42501`).
- Tenant verisine dokunan her sorgu `withTenant()`, platform sorguları `withPlatform()`
  içinden geçer. Bu kural `src/lib/db.ts` içinde belgelidir.

### 7.3 Kimlik doğrulama

- Şifreler bcrypt (12 tur) ile saklanır.
- Oturum token'ı 32 byte rastgele değer; `httpOnly`, `sameSite=lax`, üretimde `secure`.
- Oturum süresi 30 gün; süresi geçen kayıtlar temizlenebilir (`pruneExpiredSessions`).
- Middleware (edge) yalnızca **çerez varlığına** bakar; gerçek doğrulama Node.js
  tarafında (`session.server.ts`) yapılır. Böylece Prisma edge runtime'a sızmaz.
- Aktif işletme `Session.activeTenantId` üzerinde taşınır (RLS'li `Membership`
  tablosunu anonim bağlamda okumaya gerek kalmaz).
- **CSRF:** `Origin` başlığı `Host` ile eşleşmeyen POST istekleri middleware'de
  `403` ile reddedilir.
- Yetki kontrolü her server action'ın ilk satırındadır: işletme işlemleri
  `requireTenantContext()`, platform işlemleri `requirePlatformAdmin()`.
  Yetkisiz kullanıcı işlemi çalıştıramaz (işletme sahibi `deletePlanAction`
  çağırdığında veri değişmez, `/panel`'e yönlendirilir).

### 7.4 Girdi doğrulama

- Tüm server action'lar `src/lib/validation.ts` yardımcılarıyla alanları doğrular.
- Sipariş fiyatları **istemciden alınmaz**, sunucuda üründen okunur.
- Görsel yükleme: 5 MB sınırı, MIME + dosya imzası (magic number) kontrolü,
  rastgele dosya adı, oturum şartı.

---

## 8. Veritabanı modeli (özet)

**Platform tabloları:** `Plan`, `User`, `Session`, `Tenant`
**Tenant tabloları:** `Membership`, `StoreSettings`, `Category`, `Product`,
`StockMovement`, `Customer`, `Supplier`, `GoodsReceipt`, `GoodsReceiptItem`,
`Order`, `OrderItem`, `Payment`, `AuditLog`

> `Membership` bilinçli olarak RLS korumalıdır; kullanıcının hangi işletmeye ait
> olduğu `Session.activeTenantId` üzerinden çözülür (bkz. `session.server.ts`).
> Yeni bir "işletme değiştir" arayüzü eklenirse `activeTenantId` güncellenmelidir.

---

## 9. Demo modu

İki ayrı kavram vardır:

| | `DEMO_MODE` | Demo veri katmanı (`DEMO_ACTIVE`) |
|---|---|---|
| Ne yapar? | Panel/admin/vitrinde "Demo" uyarı şeridi gösterir | Veritabanı yerine bellek içi örnek veri kullanır, giriş bilgilerini doğrulamaz |
| Ne zaman açık? | `DEMO_MODE !== "false"` (varsayılan açık) | `DEMO_MODE` açık **ve** (`DATABASE_URL` yok veya `DEMO_FAKE_DATA=true`) |
| Canlı ortam | Etiket olarak kalabilir | **Kapalı olmalı** — `DATABASE_URL` tanımlı olduğu için otomatik kapanır |

### Demo veri katmanı (veritabanı bağlantısı yapılana kadar)

- `src/lib/demo-data.ts` uydurulmuş işletmeler, ürünler, siparişler, müşteriler
  vb. içerir; `src/lib/demo-client.ts` Prisma'nın bu projede kullanılan sorgu
  alt kümesini (where/orderBy/include/select/aggregate/groupBy/create/update/
  delete/transaction) taklit eder. `src/lib/db.ts` demo aktifken gerçek istemci
  yerine bunu kullanır; sayfa ve action kodları **değişmez**.
- `withTenant()` / `withPlatform()` içindeki RLS bağlamı `AsyncLocalStorage`
  ile taklit edilir; işletme verisi yine yalnızca kendi tenant'ına görünür.
- Giriş: `/login` ekranında e-posta + şifre **doğrulanmaz**, seçilen rol için
  örnek hesapla oturum açılır. Üç rol ve hedefleri:
  `admin → /admin`, `business → /panel`, `customer → /musteri` + `/shop/demo`.
  Ana sayfadaki butonlar veya panellerin üstündeki "Demo" şeridi ile rol
  değiştirmek için çıkış yapmaya gerek yoktur.
- Normal müşteri deneyimi: `/shop/demo` herkese açık vitrin (ürün seç, sipariş
  ver), `/musteri` ise "Siparişlerim" panelidir. Vitrinden verilen sipariş
  demo sırasında işletme panelindeki `/panel/orders` ekranına düşer.
- Demo sırasında yapılan ekleme/silme işlemleri aynı sunucu sürecinde görünür;
  süreç yeniden başlayınca başlangıç verisine döner. **Hiçbir kayıt gerçek
  veritabanına yazılmaz.**
- `/api/health` demo katmanı açıkken `mode: "demo"` ve
  `database: "demo-fake-data"` döner (gerçek DB kontrolü yapılmaz).

> ⚠️ **Gerçek müşteri/işletme bilgisi girilmemeli, gerçek ödeme alınmamalıdır.**
> Veritabanı bağlantısı kurulduğunda `DEMO_MODE=false` yapın; demo giriş
> kolaylığı `DATABASE_URL` varlığında zaten otomatik olarak devre dışı kalır.

---

## 10. Katkı ve sürüm kontrolü

- Ana dal: `main`. Özellikler ayrı dallarda geliştirilir, PR ile birleştirilir.
- CI (`.github/workflows/ci.yml`): `prisma generate` → `typecheck` → `build`.
- Commit öncesi: `npm run typecheck && npm run build`.

---

## 11. Sık karşılaşılan sorunlar

| Belirti | Çözüm |
|---|---|
| `Type 'any[]' is not assignable to type 'T'` (build) | `withTenant` callback'i `Prisma.TransactionClient` ile tiplenmeli (bu depoda düzeltildi) |
| Panelde her şey boş görünüyor | RLS açık ama `app.tenant_id` set edilmiyor → sorgular `withTenant()` içinde mi? |
| `/panel` 500 / "İşletme bulunamadı" | `Session.activeTenantId` boş; çıkış yapıp yeniden giriş yapın |
| Admin panelde liste boş | RLS fail-closed: platform sorguları `withPlatform()` kullanmalı |
| Görseller deploy sonrası kayboluyor | Render diski geçici; kalıcı depolama henüz yok |
| `prisma generate` motor indiremiyor | `scripts/prisma-generate.mjs` (postinstall/build) indirmeyi atlar; `npm run build` ile tekrar deneyin |
| Demo girişi açık kaldı / paneller boş | `DATABASE_URL` tanımlı mı? Demo veri katmanı yalnızca DB yokken açılır. `DEMO_FAKE_DATA=true` ile zorlayabilirsiniz (canlıda asla) |
| Giriş yaptım ama /panel "İşletme hesabı bulunamadı" diyor | Müşteri rolüyle girilmiş; üstteki Demo şeridinden "İşletme Yetkilisi"ni seçin |
| Panelde "İşletme bulunamadı" | `Session.activeTenantId` boş; çıkış yapıp yeniden giriş yapın |
| Admin panelde liste boş / RLS etkisiz | `npm run db:rls` çıktısındaki superuser uyarısına bakın, `db:app-role` ile kısıtlı role geçin |

---

## 12. Yol haritası

- **Aşama 1 — Arayüz ve demo:** tamamlandı
- **Aşama 2 — Veritabanı ve kullanıcı sistemi:** tamamlandı (RLS, oturum, kalıcı veri)
- **Aşama 3 — Gerçek işletme kullanımı:** devam ediyor
  - kalıcı görsel depolama, abonelik/ödeme, e-posta doğrulama, personel rolleri,
    otomatik testler, yedekleme, hata izleme

---

Tiverto — **İşletmeni yönet, ticaretini büyüt.**
