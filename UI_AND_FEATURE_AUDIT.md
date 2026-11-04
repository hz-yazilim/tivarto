# Tivarto — UI, Mobil Deneyim ve Rekabet Açığı Denetimi

Denetim tarihi: 4 Kasım 2026
Depo: `hz-yazilim/tivarto`
Hedef dal: `main`
Kapsam: İşletme / ürün / stok / müşteri / tedarikçi / sipariş / dijital vitrin yönetimi.

> Güvenlik ve veri ilkesi: Bu çalışma gerçek tenant, kullanıcı, sipariş veya stok verisine örnek kayıt eklemez; mevcut kayıtları silmez veya değiştirmez. Demo kullanıcıları oluşturulmaz. Kod değişiklikleri önce ayrı dalda test edilir.

## 1. İlk turda uygulanan arayüz iyileştirmeleri

- Mobil işletme ve platform yönetim panellerine sabit üst çubuk ve açılır yan menü eklendi.
- Mobil menülerde aktif sayfa durumu, erişilebilir etiketler, kapatma düğmesi ve arka plana dokunarak kapatma eklendi.
- Masaüstünde sol menü sabit ve daha dar bir çalışma alanı olarak düzenlendi.
- Mobil ekranlarda başlıkların ölçeği küçültüldü; içerik boşlukları ve kartlar sıkılaştırıldı.
- Form kontrolleri mobilde 16px metin boyutunda tutuldu (iOS otomatik yakınlaştırma riskini azaltmak için).
- Ürün tablosu masaüstünde kaldı; mobilde ürün fotoğrafı, SKU, kategori, durum, kritik stok, fiyat ve işlemleri gösteren kart görünümü eklendi.
- Müşteri ve tedarikçi satırları mobilde dikey akışa geçirildi.
- Kart ve istatistik kartlarının mobil padding ve değer taşması düzenlendi.
- Açılış sayfasının hero metni, CTA butonları ve boşlukları mobil ölçülere uyarlandı.
- Hareket azaltma tercihi (`prefers-reduced-motion`) desteklendi.
- Hiçbir özellik, route veya gerçek veri kaldırılmadı.

## 2. Kod incelemesinde görülen mevcut temel

Mevcut modüller:
- Ürünler ve kategoriler
- Stok giriş / çıkış / düzeltme
- Mal kabul
- Müşteriler ve tedarikçiler
- Siparişler ve dijital vitrin
- İşletme ekip rolleri
- Akıllı analiz
- Raporlar, destek merkezi ve işletme ayarları
- Platform yönetimi: işletmeler, kullanıcılar, planlar, ödemeler, özellik yönetimi, destek, sistem sağlığı ve işlem kayıtları

Mevcut akışlarda CSV ile toplu ürün içe aktarma, ürün fotoğrafı yükleme, minimum stok eşiği ve sipariş durumları bulunuyor.

## 3. Rakip incelemesi — ürün ve operasyon özellikleri

| Rakip / kategori | Öne çıkan kabiliyetler | Tivarto için anlamı |
|---|---|---|
| Zoho Inventory | Satın alma siparişleri, mal kabul, çoklu depo, depo transferi, raf/bin lokasyonları, barkod üretme/tarama, seri/parti takibi, satış iadesi, çok kanallı satış, sevkiyat ve webhook/otomasyon | Öncelik: barkod, satın alma siparişi, iade, depo/konum ve otomasyon |
| Mikro Yazılım | Stok maliyeti, barkod/terazi entegrasyonu, ürün grupları, minimum/hedef stok, satın alma planlama ve ayrıntılı stok raporları | Öncelik: maliyet görünürlüğü, hedef stok ve yeniden sipariş önerileri |
| AKINSOFT OctoCloud | Mobil responsive kullanım, Excel aktarımı, varyant, riskli müşteri, alış/satış belgeleri, iade, görev/takvim, e-Fatura/e-Arşiv, API ve B2B | Öncelik: varyant, müşteri riski, iade, görevler ve yerel entegrasyon |
| AltÜst | Cari hesap, şube, stok/depo, satış/alış, finans/kasa/banka, e-belge, raporlar, rol bazlı erişim ve entegrasyonlar | Öncelik: finans ve şube kabiliyetlerini ürün büyümesine göre aşamalı ele almak |

## 4. Özellik açıkları ve önerilen öncelik

### P0 — Temel operasyon kalitesi
- Mobilde tüm modüllerde taşma, tablo, form ve işlem butonları için cihaz bazlı test.
- Ürün, stok, sipariş ve müşteri listelerinde arama / filtre / sıralama / sayfalama tutarlılığı.
- Kritik stok ekranından tek adımda tedarikçi ve satın alma taslağı oluşturma.
- Stok hareketlerinde neden, belge referansı ve kullanıcı izi.
- Sipariş detayında kalemler, müşteri bilgisi, durum geçmişi ve stok etkisinin anlaşılır görünmesi.
- Boş durum, yükleniyor, hata, başarılı işlem ve onay durumlarının ortak tasarım sistemi.
- Formlarda alan doğrulama, kaydetme sırasında tekrar tıklama koruması ve anlaşılır hata mesajları.

### P1 — Rekabetçi envanter yönetimi
- Barkod / QR ile ürün bulma ve telefon kamerasıyla stok sayımı.
- Ürün varyantları (beden, renk, ölçü, paket).
- Çoklu depo ve depo transferi.
- Satın alma siparişi ve tedarikçi teklif akışı.
- Satış iadesi / değişim ve iade stok hareketi.
- Toplu CSV/Excel dışa aktarma; içe aktarmada önizleme ve satır bazlı hata raporu.
- Minimum/hedef stok ve satış hızına göre yeniden sipariş önerisi.
- Ürün alış maliyeti, ortalama maliyet ve brüt kâr raporu.

### P2 — İşletme yönetimini genişletme
- Cari hesap bakiyesi, tahsilat/ödeme ve vade takibi.
- Teklif, irsaliye ve fatura akışları.
- e-Fatura/e-Arşiv için GİB yetkili entegratör bağlantısı (sağlayıcı sözleşmesi ve anahtar gerekir).
- Kasa/banka ve ödeme mutabakatı.
- Çoklu şube ve şube bazlı raporlama.
- Görev, hatırlatma ve otomatik bildirimler.
- E-ticaret / pazaryeri / kargo bağlantıları için API ve webhook altyapısı.

### P3 — Ölçek ve otomasyon
- Yetki matrisi: modül ve işlem bazlı rol izinleri.
- Denetim günlüğü ve hassas işlemlerde ikinci onay.
- Gelişmiş rapor panosu, dönem karşılaştırma ve CSV/PDF dışa aktarma.
- Talep tahmini ve anomali uyarıları; öneri olarak sunulmalı, otomatik stok değiştirmemeli.
- Entegrasyon merkezi ve API anahtarlarının güvenli yönetimi.

## 5. Tasarım yönü

- Görsel dil: koyu mürdüm / mor ana palet, kontrollü vurgu rengi, yüksek kontrast ve daha az görsel gürültü.
- Masaüstü: sol navigasyon + içerik alanı + bağlama duyarlı hızlı işlemler.
- Mobil: sabit üst bar + açılır menü; tam genişlik formlar; kart tabanlı listeler; yatay kaydırmaya mecbur bırakmayan temel işlemler.
- Tipografi: içerik 14–15px; yardımcı metin 12–13px; başlıklar ekran genişliğine göre ölçeklenir.
- Tutarlılık: ortak kart, tablo, form, durum etiketi, modal, toast ve boş durum bileşenleri.
- Erişilebilirlik: klavye odağı, dokunma alanı, ekran okuyucu etiketleri ve hareket azaltma.

## 6. Henüz yapılmış sayılmaması gerekenler

Bu dokümandaki P1–P3 maddeleri analiz ve yol haritasıdır; henüz tamamlanmış özellik değildir. Ödeme, e-belge, kargo, e-posta ve pazaryeri bağlantıları sağlayıcı hesabı / API anahtarı / sözleşme olmadan canlıya alınamaz. Özellikler yalnızca gerçek veritabanı şeması, yetkilendirme, denetim izi ve uçtan uca testleri tamamlandığında "tamamlandı" olarak işaretlenmelidir.

## 7. Güvenli yayın kontrol listesi

- [ ] GitHub CI: lint/typecheck, Prisma validate, build, audit.
- [ ] Mobil test: 360px, 390px, 430px genişlik.
- [ ] Tablet: 768px ve 1024px.
- [ ] Masaüstü: 1280px ve 1440px.
- [ ] İşletme ve platform yönetimi için yetkisiz erişim kontrolü.
- [ ] Ürün ekle/düzenle/pasifleştir/sil akışları.
- [ ] Stok giriş/çıkış/düzeltme ve sipariş iptali stok tutarlılığı.
- [ ] CSV import doğrulama ve hata senaryoları.
- [ ] Canlı veritabanında test verisi oluşturulmadan smoke test.
- [ ] Vercel preview başarılı olmadan main'e merge yok.
