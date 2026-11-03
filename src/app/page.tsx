import Link from "next/link";

const FEATURES = [
  { title: "Ürün Yönetimi", desc: "Ürünlerini tek ekrandan ekle, düzenle ve kategorilere ayır.", icon: "📦", tag: "Düzenli katalog" },
  { title: "Akıllı Stok Takibi", desc: "Stok giriş-çıkışlarını izle, kritik seviyeleri erkenden fark et.", icon: "📊", tag: "Kontrol sende" },
  { title: "Dijital Vitrin", desc: "Ürünlerini müşterilerinle paylaşabileceğin çevrimiçi vitrinde sergile.", icon: "🛍️", tag: "7/24 açık" },
  { title: "Mal Kabul", desc: "Tedarikçi teslimatlarını eksik ve hasarlı kayıtlarıyla stoğa al.", icon: "🚚", tag: "Kolay kayıt" },
  { title: "Müşteri & Tedarikçi", desc: "İş ilişkilerini, kişi kartlarını ve geçmiş hareketleri bir arada tut.", icon: "👥", tag: "Tek merkez" },
  { title: "Sipariş Yönetimi", desc: "Gelen siparişleri durumlarına göre takip et ve süreci yönet.", icon: "🧾", tag: "Hızlı takip" },
];

export default function Home() {
  return (
    <main className="relative mx-auto min-h-screen max-w-6xl overflow-hidden px-4 py-8 sm:px-6 md:py-14">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-24 h-80 w-80 rounded-full bg-purple-700/15 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-36 top-72 h-80 w-80 rounded-full bg-rose-700/10 blur-3xl" />

      <nav className="relative z-10 mb-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="tiverto-gradient flex h-10 w-10 items-center justify-center rounded-xl text-lg font-black text-white shadow-lg shadow-purple-950/40">T</span>
          <span className="text-xl font-bold tracking-tight">tivarto<span className="text-purple-300">.</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/5 hover:text-white">Giriş Yap</Link>
          <Link href="/register" className="tiverto-gradient rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-950/30 transition hover:opacity-90">Hesap Oluştur</Link>
        </div>
      </nav>

      <section className="relative z-10 mx-auto max-w-4xl pb-16 pt-4 text-center md:pb-20 md:pt-10">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-400/25 bg-purple-500/10 px-4 py-2 text-xs font-semibold tracking-wide text-purple-200">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.8)]" />
          İŞLETMEN İÇİN TEK MERKEZ
        </div>
        <h1 className="text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl md:text-7xl">
          İşini yönetmek artık <span className="tiverto-gradient-text">daha kolay.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
          Ürünlerini, stoklarını, müşterilerini ve siparişlerini tek bir yerden yönet.
          Tivarto ile günlük operasyonlarını sadeleştir, işine odaklan.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/register" className="inline-flex h-12 w-full items-center justify-center rounded-xl tiverto-gradient px-7 text-base font-semibold text-white shadow-xl shadow-purple-950/40 transition hover:opacity-90 sm:w-auto">Hesap Oluştur <span className="ml-2">→</span></Link>
          <Link href="/login" className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] px-7 text-base text-zinc-200 transition hover:bg-white/[0.08] sm:w-auto">Hesabıma Giriş Yap</Link>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-500">
          <span>✓ Kolay kullanım</span><span>✓ Tek panelden yönetim</span><span>✓ Mobil uyumlu deneyim</span>
        </div>
      </section>

      <section className="relative z-10 mb-16">
        <div className="mb-7 text-center">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-purple-300">TİVERTO İLE</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">İşletmenin ihtiyaçları, tek platformda</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">Dağınık tablolar ve farklı araçlar yerine, iş akışını bir arada takip edebileceğin sade bir alan.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <article key={f.title} className="tiverto-card group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:border-purple-400/40 hover:shadow-xl hover:shadow-purple-950/20 sm:p-6">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl transition group-hover:bg-rose-500/10" />
              <div className="relative flex items-start justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-300/15 bg-purple-500/10 text-2xl">{f.icon}</span>
                <span className="text-[11px] font-medium text-zinc-500">0{i + 1}</span>
              </div>
              <h3 className="relative mt-5 font-semibold text-zinc-100">{f.title}</h3>
              <p className="relative mt-2 text-sm leading-6 text-zinc-400">{f.desc}</p>
              <div className="relative mt-5 text-xs font-semibold text-purple-300">{f.tag} <span className="text-rose-300">↗</span></div>
            </article>
          ))}
        </div>
      </section>

      <footer className="relative z-10 mt-14 border-t border-white/10 pt-7 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} Tivarto · İşletmeni yönet, ticaretini büyüt.
      </footer>
    </main>
  );
}
