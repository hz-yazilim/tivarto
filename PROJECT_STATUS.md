# Tivarto — Kalıcı Proje Durumu ve Devam Talimatları

> Bu dosya sonraki oturumlarda mimariyi, canlı ortamı, gerçek kullanıcı verisini ve açık işleri doğru anlamak için tutulur. Kod ve canlı ayarlar bu dosyadan daha güncelse gerçek kabul edilir ve bu dosya güncellenir.

## Proje
- Repo: `hz-yazilim/tivarto`; ana dal: `main`.
- Next.js 15, React 19, TypeScript, Tailwind, Prisma 6, PostgreSQL 17.
- Canlı: Vercel `tivarto`, https://tivarto.vercel.app.
- Veritabanı: Supabase `tivarto-prod`, proje ref `ilitnbwqqkmarwlenong`, eu-central-1.
- Yayın akışı: GitHub `main` → Vercel Production.

## GERÇEK KULLANICI VERİSİ — SİLME / SIFIRLAMA YASAK
Canlı veritabanında görülen kullanıcılar ve işletmeler GERÇEKTİR; örnek/demo değildir. Son salt-okunur kontrolde 4 kullanıcı, 3 işletme, 1 destek talebi ve 1 aktif platform yöneticisi vardı; `demo` slug'lı işletme yoktu.
- Kullanıcı, işletme, üyelik, oturum ve destek kayıtlarını test için silme.
- Canlıda truncate/reset/seed/demo-cleanup veya veri kaybettiren migration çalıştırma.
- Örnek kullanıcı/işletme/ürün/sipariş üretme.
- Migration'lar geriye uyumlu ve veri koruyucu olmalı.

## Canlı ayarlar ve güvenlik
- Vercel Production: `DEMO_MODE=false`, `DEMO_FAKE_DATA=false`, `TIVARTO_REAL_MODE=true`.
- `DATABASE_URL` runtime için `tivarto_app` kısıtlı rol; `DIRECT_URL` migration için; `APP_DB_PASSWORD` rol yönetimi.
- Tenant sorguları `withTenant`; platform sorguları `withPlatform` içinden geçmeli.
- Tenant RLS etkin/zorunlu. Platform tablolarında advisor uyarısı var; anon/authenticated doğrudan tablo yetkisi yok. Policiesiz RLS açıp auth/admin akışlarını bozma.
- `requirePlatformAdmin`, `requireTenantContext`, `requireWritableTenantContext` kontrollerini atlama. Gizli anahtarları kaynak koda yazma.

## Modüller
Kimlik doğrulama/oturum/şifre değiştirme; işletme, plan, üyelik, mağaza ayarları; ürün/kategori, stok, mal kabul; müşteri/tedarikçi, sipariş, dijital vitrin; raporlar/CSV; platform admin kullanıcı/işletme/plan/manuel ödeme kaydı/destek/audit log; PWA/offline; destek talebi sahibinin ve adminin silmesi. Ekip ekranında mevcut Tivarto hesabı ekleme ve OWNER/STAFF rolü düzenleme var; e-posta daveti yok.

## Kalıcı görsel depolama
Vercel Blob store `tivarto-media` oluşturuldu (store ID `store_KBaNi0aENrQYJFMJ`) ve Vercel projesine bağlandı. `BLOB_READ_WRITE_TOKEN` Production/Preview/Development'e otomatik eklenir. Yeni görseller `tenants/<tenantId>/...` yolunda tutulur; üretimde `public/uploads` yerel diskine yazma. Yükleme aktif işletme oturumu, dosya boyutu/MIME/magic-byte kontrollerinden geçer.

## Açık işler — mevcut değilken varmış gibi gösterme
1. E-posta doğrulama/şifre sıfırlama için Resend/SMTP sağlayıcı ve gizli API/SMTP bilgisi gerekir.
2. Personel davet bağlantısı ve kabul ekranı tamamlanmalı.
3. PayTR/iyzico için merchant kimlikleri, API key/salt ve webhook doğrulaması gerekir. Admin ödeme kaydı manuel; gerçek tahsilat değildir.
4. E-fatura/e-arşiv için yetkili sağlayıcı hesabı/API bilgisi gerekir.
5. Otomatik yedekleme, geri yükleme testi, dağıtık rate limiting ve 2FA.
6. Blob yüklemesi canlıda gerçek işletme oturumu ile test edilmeli.
7. Eski `/uploads/...` referanslarındaki dosyalar Vercel geçici diskinde kalmış olabilir; bazıları yeniden yüklenmek zorunda kalabilir.
8. Silme akışlarında Blob nesneleri tenant sahipliği doğrulanarak temizlenmeli.
9. E2E ve tenant izolasyon regresyon testleri genişletilmeli.

## Yayın kontrol listesi
`npm ci`; `npm run typecheck`; `npx prisma validate`; `npm run build`; `npm audit`. PR CI geçmeden main'e merge etme. Merge sonrası Vercel Production `READY`, `/api/health`, giriş/panel/admin ve görsel yükleme smoke testlerini doğrula. Canlı kullanıcı/işletme sayılarının değişmediğini salt-okunur sorguyla kontrol et. Build hatasını logdan düzeltip yeniden yayınla; çözülmeden başarılı deme.

## Çalışma kuralı
Kullanıcı teknik olmayan biridir; mümkün olan işleri GitHub/Vercel/Supabase üzerinden doğrudan yap. Yalnızca dış sağlayıcı hesabı, doğrulanmış alan adı veya gizli anahtar gibi gerçekten kullanıcıdan gereken bilgileri iste. Hiçbir manuel kayıt/entegrasyonu otomatik e-posta veya gerçek tahsilat diye adlandırma.
