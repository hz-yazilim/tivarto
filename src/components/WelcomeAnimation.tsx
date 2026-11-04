"use client";

const PRODUCTS = [
  { emoji: "👕", label: "Moda", color: "#d946ef" },
  { emoji: "📱", label: "Elektronik", color: "#3b82f6" },
  { emoji: "💄", label: "Kozmetik", color: "#ec4899" },
  { emoji: "☕", label: "Kafe", color: "#f59e0b" },
  { emoji: "👟", label: "Ayakkabı", color: "#8b5cf6" },
  { emoji: "🧴", label: "Temizlik", color: "#10b981" },
  { emoji: "💊", label: "Sağlık", color: "#fb7185" },
  { emoji: "🔧", label: "Hırdavat", color: "#f97316" },
];

export default function WelcomeAnimation() {
  return (
    <section className="relative z-10 mx-auto mb-16 w-full max-w-5xl overflow-hidden rounded-[28px] border border-purple-400/20 bg-gradient-to-br from-[#100820] via-[#170b2d] to-[#210d31] px-4 py-8 shadow-2xl shadow-purple-950/20 sm:px-8 sm:py-10">
      <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-purple-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-pink-600/15 blur-3xl" />
      <div className="relative grid items-center gap-8 md:grid-cols-[.9fr_1.1fr]">
        <div className="text-center md:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-purple-300/20 bg-purple-400/10 px-3 py-1.5 text-[10px] font-bold tracking-[.18em] text-purple-200">
            <i className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> TIVARTO FLOW
          </span>
          <h2 className="mt-5 text-2xl font-extrabold leading-tight sm:text-3xl">
            Ürünlerin dağınık kalmasın.
            <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-rose-300 bg-clip-text text-transparent">Hepsi tek merkezde.</span>
          </h2>
          <p className="mt-4 text-sm leading-6 text-zinc-300">
            Ürünlerini sisteme ekle, kategorilerinde düzenle; stoklarını, siparişlerini ve işletme hareketlerini Tivarto üzerinden takip et.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs text-zinc-300 md:justify-start">
            {["Ürün yönetimi", "Stok takibi", "Sipariş kontrolü"].map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-2">✓ {item}</span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto h-[290px] w-full max-w-[440px] overflow-hidden rounded-3xl border border-white/10 bg-[#090511]/70 sm:h-[320px]">
          <div className="absolute left-0 right-0 top-5 text-center text-[10px] font-bold tracking-[.16em] text-zinc-400">ÜRÜNLERİN TOPLANIYOR</div>
          <div className="tv-flow-basket">
            <div className="tv-flow-basket-items">
              {PRODUCTS.map((product, index) => (
                <span key={product.label} className="tv-flow-falling" style={{
                  left: `${7 + (index % 4) * 25}%`,
                  animationDelay: `${index * .55}s`,
                  background: `linear-gradient(145deg, ${product.color}, #a855f7)`,
                }}>{product.emoji}</span>
              ))}
            </div>
            <div className="tv-flow-basket-front">T</div>
          </div>
          <div className="tv-flow-shelves">
            {PRODUCTS.map((product, index) => (
              <div key={product.label} className="tv-flow-shelf" style={{ animationDelay: `${index * .12}s` }}>
                <span style={{ background: `linear-gradient(145deg, ${product.color}, #a855f7)` }}>{product.emoji}</span>
                <small>{product.label}</small>
              </div>
            ))}
          </div>
          <div className="absolute bottom-3 left-0 right-0 text-center text-[10px] font-semibold tracking-wide text-purple-200">TOPLA → DÜZENLE → YÖNET</div>
        </div>
      </div>
      <style>{`
        .tv-flow-basket{position:absolute;left:50%;top:43%;width:126px;height:88px;transform:translate(-50%,-50%)}
        .tv-flow-basket-front{position:absolute;inset:12px 0 0;display:grid;place-items:center;border:1px solid rgba(255,255,255,.25);border-radius:13px 13px 20px 20px;background:linear-gradient(135deg,#7c3aed,#a855f7 50%,#ec4899);box-shadow:0 10px 24px #7c3aed55,inset 0 1px 0 #ffffff55;font-size:25px;font-weight:900;color:#ffffff99}
        .tv-flow-basket-items{position:absolute;inset:0;z-index:2}
        .tv-flow-falling{position:absolute;top:-46px;width:29px;height:29px;display:grid;place-items:center;border:1px solid #ffffff55;border-radius:9px;font-size:16px;box-shadow:0 5px 12px #0006;animation:tvFlowDrop 3.4s cubic-bezier(.2,.7,.25,1) infinite}
        .tv-flow-shelves{position:absolute;left:13px;right:13px;bottom:35px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}
        .tv-flow-shelf{min-width:0;height:65px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border:1px solid #a855f744;border-radius:11px;background:#ffffff08;animation:tvFlowShelf 1s ease both}
        .tv-flow-shelf span{width:27px;height:27px;display:grid;place-items:center;border:1px solid #ffffff33;border-radius:8px;font-size:14px}
        .tv-flow-shelf small{font-size:8px;color:#c4b5fd;white-space:nowrap}
        @keyframes tvFlowDrop{0%{opacity:0;transform:translateY(-12px) rotate(-12deg)}12%{opacity:1}75%{opacity:1;transform:translateY(126px) rotate(8deg)}100%{opacity:0;transform:translateY(132px) scale(.75)}}
        @keyframes tvFlowShelf{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @media(prefers-reduced-motion:reduce){.tv-flow-falling,.tv-flow-shelf{animation:none!important}}
      `}</style>
    </section>
  );
}
