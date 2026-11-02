export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Tivarto</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          İşletmeni yönet, dijital mağazanı otomatik aç.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Ürün, stok, müşteri, tedarikçi ve sipariş yönetimiyle birlikte ücretsiz bir
          internet mağazası sunan abonelik tabanlı SaaS platformu.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <a
            key={i}
            href="/login"
            className="group rounded-xl border border-input bg-card p-6 text-card-foreground hover:bg-accent transition-colors"
          >
            <div className="mb-3 rounded-lg bg-secondary p-3 group-hover:bg-accent/80 transition-colors">
              {i === 1 && "📦"}
              {i === 2 && "📊"}
              {i === 3 && "🛒"}
              {i === 4 && "📦🚚"}
              {i === 5 && "👥"}
              {i === 6 && "🧾"}
            </div>
            <h3 className="mb-2 font-semibold">{FEATURES[i - 1].title}</h3>
            <p className="text-sm text-muted-foreground">{FEATURES[i - 1].desc}</p>
          </a>
        ))}
      </div>

      <div className="mt-16 flex items-center justify-center gap-4">
        <a
          href="/register"
          className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          Ücretsiz Başlat
        </a>
        <a href="/login" className="text-sm text-muted-foreground hover:underline">
          Zaten hesabınız var mı? Giriş yapın
        </a>
      </div>
    </div>
  );
}

const FEATURES = [
  { title: "Ürün Yönetimi", desc: "Ürün ekleyin, kategorilere ayırın, fiyat ve stok güncelleyin." },
  { title: "Stok Takibi", desc: "Giriş-çıkış kayıtları, kritik stok uyarıları ve stok geçmişi." },
  { title: "Dijital Mağaza", desc: "Kendi internet sitenizde ürünlerinizi yayınlayın." },
  { title: "Mal Kabulü", desc: "Tedarikçiden gelen ürünleri kaydedin, eksik/hasarlı kayıtlayın." },
  { title: "Müşteri & Tedarikçi", desc: "Müşteri ve tedarikçi kartları, sipariş geçmişi." },
  { title: "Sipariş Yönetimi", desc: "Web sitenizden gelen siparişleri yönetin, stok güncelleyin." },
];
