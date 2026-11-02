/**
 * Demo modu bilgilendirmesi.
 * Kullanıcı isteği: "Demo işlemlerinin gerçek veri kaydı yapmadığının açıkça belirtilmesi".
 * DEMO_MODE ortam değişkeni kapalıysa (gerçek kullanım) hiçbir şey gösterilmez.
 */
export const DEMO_MODE = process.env.DEMO_MODE !== "false";

export default function DemoBanner() {
  if (!DEMO_MODE) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      <span className="rounded bg-amber-200 px-1.5 py-0.5 font-semibold uppercase tracking-wide">
        Demo
      </span>
      <span>
        Bu ortam tanıtım amaçlıdır. Ekranlardaki kayıtlar örnek veridir; gerçek
        müşteri/işletme bilgisi ve gerçek ödeme kullanılmamalıdır.
      </span>
    </div>
  );
}
