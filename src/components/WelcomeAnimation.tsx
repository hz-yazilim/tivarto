"use client";

import { useEffect, useState } from "react";

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
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<"collecting" | "distributing" | "brand">("collecting");

  useEffect(() => {
    const storageKey = "tivarto-welcome-animation-v1";
    try {
      if (window.localStorage.getItem(storageKey)) return;
      window.localStorage.setItem(storageKey, "shown");
    } catch {
      // If storage is unavailable, still show the intro for this visit.
    }

    setVisible(true);
    const distributeTimer = window.setTimeout(() => setPhase("distributing"), 6100);
    const brandTimer = window.setTimeout(() => setPhase("brand"), 9000);
    const closeTimer = window.setTimeout(() => setVisible(false), 11900);

    return () => {
      window.clearTimeout(distributeTimer);
      window.clearTimeout(brandTimer);
      window.clearTimeout(closeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="tv-intro-overlay" role="dialog" aria-label="Tivarto tanıtım animasyonu">
      <button className="tv-intro-skip" onClick={() => setVisible(false)} type="button">
        Atla <span aria-hidden="true">×</span>
      </button>

      <div className="tv-intro-content">
        <div className="tv-intro-stage">
          <div className="tv-intro-glow tv-intro-glow-one" />
          <div className="tv-intro-glow tv-intro-glow-two" />

          <div className="tv-intro-status">
            <span className="tv-intro-dot" />
            {phase === "collecting"
              ? "Stoklar tek merkezde toplanıyor"
              : phase === "distributing"
                ? "Ürünler raflara otomatik yerleşiyor"
                : "İşletmen için tek merkez"}
          </div>
          <div className="tv-intro-kicker">TIVARTO FLOW · AKILLI İŞLETME YÖNETİMİ</div>

          <div className={`tv-intro-basket ${phase !== "collecting" ? "tv-intro-basket-away" : ""}`}>
            <div className="tv-intro-basket-shine" />
            <div className="tv-intro-basket-items">
              {PRODUCTS.map((product, index) => (
                <span
                  className="tv-intro-falling-product"
                  key={product.label}
                  style={{
                    left: `${8 + (index % 4) * 25}%`,
                    animationDelay: `${index * 0.48}s`,
                    background: `linear-gradient(145deg, ${product.color}, #a855f7)`,
                  }}
                >
                  {product.emoji}
                </span>
              ))}
            </div>
            <div className="tv-intro-basket-front">
              <span> T </span>
            </div>
          </div>

          <div className={`tv-intro-shelves ${phase === "collecting" ? "tv-intro-shelves-hidden" : ""}`}>
            {PRODUCTS.map((product, index) => (
              <div className="tv-intro-shelf-slot" key={product.label} style={{ animationDelay: `${index * 0.11}s` }}>
                <span style={{ background: `linear-gradient(145deg, ${product.color}, #a855f7)` }}>
                  {product.emoji}
                </span>
                <i />
              </div>
            ))}
          </div>

          {phase === "brand" && (
            <div className="tv-intro-brand">
              <div className="tv-intro-brand-mark">T</div>
              <h1>tivarto<span>.</span></h1>
              <p>İşletmen için tek merkez</p>
              <small>STOK · SİPARİŞ · KARGO · MUHASEBE</small>
              <div className="tv-intro-brand-dots"><i /><i /><i /></div>
            </div>
          )}
        </div>

        <div className="tv-intro-caption">
          <span>Ürünler</span><b>→</b><span>Sepete düşer</span><b>→</b><span>Raflara yerleşir</span>
          <strong>Tivarto otomasyon</strong>
        </div>
      </div>

      <style>{`
        .tv-intro-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px 16px;background:#05020e;color:#fff;font-family:Arial,Helvetica,sans-serif;animation:tvFadeIn .35s ease both}
        .tv-intro-content{width:100%;max-width:360px;display:flex;flex-direction:column;align-items:center}
        .tv-intro-stage{position:relative;width:100%;height:520px;overflow:hidden;border:1px solid rgba(124,58,237,.25);border-radius:32px;background:linear-gradient(180deg,#0a0618 0%,#140a2b 55%,#1a0b2e 100%);box-shadow:0 20px 80px rgba(124,58,237,.22),0 8px 32px rgba(236,72,153,.14)}
        .tv-intro-glow{position:absolute;width:220px;height:220px;border-radius:50%;filter:blur(48px);pointer-events:none}
        .tv-intro-glow-one{top:-100px;left:-70px;background:rgba(124,58,237,.3)}
        .tv-intro-glow-two{right:-90px;bottom:-90px;background:rgba(236,72,153,.25)}
        .tv-intro-status{position:absolute;top:24px;left:12px;right:12px;display:flex;justify-content:center;align-items:center;gap:9px;font-size:11px;font-weight:700;color:rgba(255,255,255,.82);text-align:center}
        .tv-intro-dot{width:7px;height:7px;flex:none;border-radius:50%;background:#34d399;box-shadow:0 0 12px #34d399;animation:tvPulse 1.2s infinite}
        .tv-intro-kicker{position:absolute;top:55px;width:100%;text-align:center;font-size:9px;letter-spacing:2px;color:rgba(255,255,255,.4);font-weight:700}
        .tv-intro-basket{position:absolute;left:50%;top:42%;width:148px;height:110px;transform:translate(-50%,-50%);transition:opacity .5s,transform .6s}
        .tv-intro-basket-away{opacity:0;transform:translate(-50%,-50%) scale(.72)}
        .tv-intro-basket-front{position:absolute;inset:8px 0 0;border:1px solid rgba(255,255,255,.2);border-radius:16px 16px 25px 25px;background:linear-gradient(135deg,#7c3aed,#a855f7 35%,#ec4899);box-shadow:0 12px 28px rgba(124,58,237,.4),inset 0 1px 0 rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:900}
        .tv-intro-basket-front span{opacity:.5}
        .tv-intro-basket-shine{position:absolute;z-index:2;top:8px;left:10px;right:10px;height:2px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.8),transparent)}
        .tv-intro-basket-items{position:absolute;z-index:3;inset:0}
        .tv-intro-falling-product{position:absolute;top:-42px;width:36px;height:36px;border:1px solid rgba(255,255,255,.3);border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:19px;box-shadow:0 7px 18px rgba(0,0,0,.25);animation:tvDrop 1.15s cubic-bezier(.2,.75,.25,1) both}
        .tv-intro-shelves{position:absolute;left:20px;right:20px;bottom:20px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;transition:opacity .4s}
        .tv-intro-shelves-hidden{opacity:0}
        .tv-intro-shelf-slot{height:68px;border:1px dashed rgba(168,85,247,.35);border-radius:14px;background:rgba(255,255,255,.035);display:flex;align-items:center;justify-content:center;position:relative;animation:tvSlotIn .45s cubic-bezier(.34,1.56,.64,1) both}
        .tv-intro-shelf-slot span{width:38px;height:38px;border:1px solid rgba(255,255,255,.25);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:19px;box-shadow:0 5px 14px rgba(0,0,0,.2)}
        .tv-intro-shelf-slot i{position:absolute;right:5px;top:5px;width:7px;height:7px;border-radius:50%;background:#34d399;box-shadow:0 0 8px #34d399}
        .tv-intro-brand{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 38%,rgba(124,58,237,.82),rgba(19,8,42,.97) 72%);animation:tvBrandIn .65s cubic-bezier(.34,1.56,.64,1) both}
        .tv-intro-brand-mark{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,#7c3aed,#a855f7 45%,#ec4899);font-size:24px;font-weight:900;box-shadow:0 10px 28px rgba(124,58,237,.45)}
        .tv-intro-brand h1{margin:16px 0 0;font-size:56px;line-height:1;font-weight:900;letter-spacing:-3px;background:linear-gradient(100deg,#c4b5fd,#e879f9 45%,#fb7185);color:transparent;background-clip:text}
        .tv-intro-brand h1 span{color:#fb7185}
        .tv-intro-brand p{margin:12px 0 0;font-size:13px;font-weight:700;color:rgba(255,255,255,.85)}
        .tv-intro-brand small{margin-top:18px;font-size:9px;letter-spacing:2px;color:rgba(255,255,255,.5)}
        .tv-intro-brand-dots{display:flex;gap:7px;margin-top:26px}
        .tv-intro-brand-dots i{width:6px;height:6px;border-radius:50%;background:#c4b5fd;animation:tvPulse 1.3s infinite}
        .tv-intro-brand-dots i:nth-child(2){animation-delay:.2s}.tv-intro-brand-dots i:nth-child(3){animation-delay:.4s}
        .tv-intro-caption{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:8px;margin-top:18px;font-size:11px;color:rgba(255,255,255,.58)}
        .tv-intro-caption b{color:rgba(255,255,255,.25)}.tv-intro-caption strong{color:rgba(255,255,255,.85)}
        .tv-intro-skip{position:fixed;top:calc(16px + env(safe-area-inset-top));right:16px;z-index:2;border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:8px 13px;background:rgba(255,255,255,.08);color:#fff;font-size:12px;font-weight:700;backdrop-filter:blur(12px)}
        @keyframes tvFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes tvPulse{50%{opacity:.45;transform:scale(.86)}}
        @keyframes tvDrop{0%{transform:translateY(-20px) rotate(-12deg);opacity:0}15%{opacity:1}80%{transform:translateY(240px) rotate(8deg);opacity:1}100%{transform:translateY(246px) rotate(0) scale(.78);opacity:0}}
        @keyframes tvSlotIn{from{opacity:0;transform:translateY(16px) scale(.7)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes tvBrandIn{from{opacity:0;transform:scale(.82);filter:blur(10px)}to{opacity:1;transform:scale(1);filter:blur(0)}}
        @media(max-width:420px){.tv-intro-stage{height:min(520px,calc(100dvh - 110px))}.tv-intro-caption{font-size:10px;gap:6px}}
        @media(prefers-reduced-motion:reduce){.tv-intro-overlay *{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
      `}</style>
    </div>
  );
}
