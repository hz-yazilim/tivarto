import Link from "next/link";

export const metadata = {
  title: "Gizlilik Politikası | Tivarto",
  description: "Tivarto hesap, işletme ve kişisel verilerinin işlenmesine ilişkin gizlilik açıklaması.",
};

const sections = [
  {
    title: "1. Veri sorumlusu ve iletişim",
    body: "Tivarto hizmetinin veri sorumlusu bilgileri, uygulama mağazasında yer alan yayıncı bilgileriyle aynı olmalıdır. Yayına çıkmadan önce bu bölümde yayıncının tam yasal unvanı, adresi ve KVKK başvuru kanalı açıkça belirtilmelidir. Gizlilik ve veri talepleri için şu an iletişim kanalı: hz.yazilimm@gmail.com.",
  },
  {
    title: "2. İşlenen veri kategorileri",
    body: "Hesap verileri (ad, e-posta, parola özeti ve hesap durumu); işletme profili ve üyelik/rol bilgileri; ürün, kategori, stok hareketi, sipariş, müşteri ve tedarikçi kayıtları; mağaza iletişim bilgileri ve yüklenen görseller; destek talepleri; oturum, güvenlik ve denetim kayıtları işlenebilir. Hesap silme talebinde e-posta doğrulaması için tek kullanımlık bağlantı ve kötüye kullanımı önlemek amacıyla IP'den türetilmiş takma adlı istek parmak izi işlenir.",
  },
  {
    title: "3. İşleme amaçları",
    body: "Veriler hesap oluşturma ve oturum açma, işletme yönetimi özelliklerini sağlama, ürün/stok/sipariş kayıtlarını yürütme, destek sunma, güvenliği sağlama, kötüye kullanımı önleme, yasal yükümlülükleri yerine getirme ve hesap silme taleplerini doğrulayıp sonuçlandırma amaçlarıyla işlenir.",
  },
  {
    title: "4. Altyapı ve hizmet sağlayıcılar",
    body: "Tivarto'nun barındırma ve uygulama sunucusu için Vercel, veritabanı PostgreSQL altyapısı (kurulu ortama göre Supabase), yüklenen görseller için Vercel Blob ve hesap silme doğrulama e-postaları için yapılandırıldığında Resend gibi hizmet sağlayıcılar kullanılabilir. Bu sağlayıcılar yalnızca hizmetin işletilmesi için gerekli verileri işler. Üretimde etkin olan tüm sağlayıcılar ve olası yurt dışı aktarım mekanizmaları yayın öncesi bu metin ve Play Console Veri Güvenliği beyanında teyit edilmelidir.",
  },
  {
    title: "5. Çerezler ve cihaz izinleri",
    body: "Oturumun sürdürülmesi ve güvenli kimlik doğrulama için zorunlu, httpOnly oturum çerezi kullanılır. Uygulama özellikleri gerektirmedikçe konum, rehber, mikrofon veya kamera izni talep edilmez. Android izinleri yalnızca ilgili özellik etkinleştirildiğinde ve kullanıcıya açıklanarak istenmelidir.",
  },
  {
    title: "6. Saklama ve silme",
    body: "Hesap verileri hizmet ilişkisi devam ettiği sürece tutulur. Hesap silme tamamlandığında giriş bilgileri, oturumlar ve doğrudan hesap bağlantıları silinir veya anonimleştirilir. İşletmenin ortak ürün, stok, sipariş ve finansal kayıtları diğer işletme kullanıcılarının işleyişi ve kanuni saklama yükümlülükleri nedeniyle ayrıca değerlendirilir; yalnızca bir kullanıcının hesabını silmesi işletmenin tamamını otomatik olarak silmez. Yasal olarak saklanması zorunlu veriler ilgili süre boyunca tutulabilir. Yedeklerdeki kopyalar sağlayıcının yedek döngüsü içinde silinir.",
  },
  {
    title: "7. Güvenlik",
    body: "Tivarto HTTPS bağlantısı, parola özeti, sunucu tarafı oturum doğrulaması, işletme bazlı erişim denetimleri ve veritabanı satır düzeyinde güvenlik mekanizmaları kullanacak şekilde tasarlanmıştır. Hiçbir internet aktarımı veya depolama yöntemi mutlak güvenlik garantisi vermez; şüpheli erişim durumunda destek kanalıyla iletişime geçilmelidir.",
  },
  {
    title: "8. Haklarınız ve başvuru",
    body: "Kişisel verilerinizle ilgili erişim, düzeltme, silme ve yürürlükteki mevzuattan doğan diğer taleplerinizi hz.yazilimm@gmail.com adresine iletebilirsiniz. Uygulama içinden Hesabım ve Verilerim bölümünü kullanabilir veya uygulamayı yüklemeden hesap silme talebi gönderebilirsiniz.",
  },
  {
    title: "9. Politika değişiklikleri",
    body: "Hizmet özellikleri, kullanılan altyapı veya mevzuat değiştiğinde bu metin güncellenebilir. Önemli değişiklikler uygulama içinde veya uygun iletişim kanalıyla duyurulur.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-12 text-white sm:px-6">
      <header className="mb-9">
        <Link href="/hesap-silme" className="text-sm text-purple-300 hover:underline">← Hesap silme sayfası</Link>
        <p className="mt-7 text-xs font-bold uppercase tracking-[.2em] text-purple-300">TİVARTO / GİZLİLİK</p>
        <h1 className="mt-3 text-3xl font-extrabold">Gizlilik Politikası</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">Son güncelleme: 5 Kasım 2026</p>
      </header>
      <div className="mb-7 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
        Yayın öncesi tamamlanması gereken bilgi: veri sorumlusunun tam yasal unvanı ve adresi ile üretimde etkin olan tüm veri işleyenler ve saklama süreleri teyit edilmelidir. Bu taslak, Play Store'a gönderilmeden önce gerçek operasyonla ve KVKK yükümlülükleriyle karşılaştırılmalıdır.
      </div>
      <div className="space-y-7">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="mt-2 text-sm leading-7 text-zinc-300">{section.body}</p>
          </section>
        ))}
      </div>
      <footer className="mt-10 border-t border-white/10 pt-6 text-sm text-zinc-400">
        Hesap silme talebi: <Link href="/hesap-silme" className="text-purple-300 underline">tivarto.vercel.app/hesap-silme</Link>
      </footer>
    </main>
  );
}
