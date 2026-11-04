"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HelpCircle, ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react";

type Step = {
  target?: string;
  title: string;
  description: string;
};

const STEPS: Step[] = [
  {
    title: "Tivarto'ya hoş geldin!",
    description:
      "İşletmeni tek panelden yönetebilirsin. Bu kısa turda temel bölümleri göstereceğiz; turu istediğin zaman atlayabilirsin.",
  },
  {
    target: "dashboard-stats",
    title: "İşletmenin genel durumu",
    description:
      "Ürün, sipariş, kritik stok ve sipariş tutarı özetini burada görürsün. Veriler işletmene özel olarak gösterilir.",
  },
  {
    target: "dashboard-orders",
    title: "Son siparişlerin",
    description:
      "Yeni gelen siparişleri ve durumlarını buradan takip edebilir, tüm siparişlere tek dokunuşla geçebilirsin.",
  },
  {
    target: "dashboard-stock",
    title: "Stok kontrolü",
    description:
      "Minimum stok seviyesine inen ürünler burada görünür. Böylece stok bitmeden önlem alabilirsin.",
  },
  {
    target: "dashboard-quick-actions",
    title: "Hızlı işlemler",
    description:
      "Ürün ekleme, stok girişi, mal kabul ve vitrin işlemlerine buradan hızlıca ulaşabilirsin.",
  },
  {
    target: "smart-analysis-link",
    title: "Tivarto Akıllı Analiz",
    description:
      "Satış ivmesi, stok yenileme önerileri, atıl stok ve müşteri geri kazanım sinyalleri için Akıllı Analiz bölümünü kullan.",
  },
];

export default function PanelOnboarding({
  userId,
  tenantId,
}: {
  userId: string;
  tenantId: string;
}) {
  const storageKey = useMemo(
    () => `tivarto:onboarding:v1:${tenantId}:${userId}`,
    [tenantId, userId]
  );
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];

  const finish = useCallback(() => {
    try {
      window.localStorage.setItem(storageKey, "completed");
    } catch {
      // Storage kapalıysa tur yine kapanır; sonraki oturumda tekrar gösterilebilir.
    }
    setOpen(false);
    setStepIndex(0);
  }, [storageKey]);

  const start = useCallback(() => {
    setStepIndex(0);
    setOpen(true);
  }, []);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(storageKey) !== "completed") {
        const timer = window.setTimeout(() => setOpen(true), 650);
        return () => window.clearTimeout(timer);
      }
    } catch {
      const timer = window.setTimeout(() => setOpen(true), 650);
      return () => window.clearTimeout(timer);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!open || !step?.target) return;
    const target = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    const previousOutline = target.style.outline;
    const previousOffset = target.style.outlineOffset;
    const previousRadius = target.style.borderRadius;
    target.style.outline = "3px solid hsl(var(--primary))";
    target.style.outlineOffset = "5px";
    target.style.borderRadius = "12px";
    return () => {
      target.style.outline = previousOutline;
      target.style.outlineOffset = previousOffset;
      target.style.borderRadius = previousRadius;
    };
  }, [open, stepIndex, step]);

  return (
    <>
      <button
        type="button"
        onClick={start}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold shadow-lg transition hover:bg-accent"
        aria-label="Tivarto tanıtım turunu başlat"
      >
        <HelpCircle className="h-4 w-4" /> Tanıtım turu
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            aria-label="Tanıtım turunu kapat"
            className="absolute inset-0 bg-slate-950/55"
            onClick={finish}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="tivarto-tour-title"
            className="absolute bottom-4 left-1/2 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-2xl border border-border bg-card p-5 shadow-2xl sm:bottom-8"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="h-4 w-4" /> Tivarto'yu keşfet
              </div>
              <button
                type="button"
                onClick={finish}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Turu kapat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-3 flex items-center gap-1.5" aria-label={`${stepIndex + 1} / ${STEPS.length}`}>
              {STEPS.map((item, index) => (
                <span
                  key={item.title}
                  className={`h-1.5 flex-1 rounded-full ${index <= stepIndex ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
            <h2 id="tivarto-tour-title" className="text-lg font-bold">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
            <div className="mt-5 flex items-center justify-between gap-3">
              <button type="button" onClick={finish} className="text-sm text-muted-foreground hover:text-foreground">
                Turu atla
              </button>
              <div className="flex items-center gap-2">
                <span className="mr-1 text-xs tabular-nums text-muted-foreground">{stepIndex + 1}/{STEPS.length}</span>
                {stepIndex > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStepIndex((value) => Math.max(0, value - 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-input px-3 py-2 text-sm font-medium hover:bg-accent"
                  >
                    <ChevronLeft className="h-4 w-4" /> Geri
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => (stepIndex === STEPS.length - 1 ? finish() : setStepIndex((value) => value + 1))}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  {stepIndex === STEPS.length - 1 ? "Başla" : "İleri"}
                  {stepIndex === STEPS.length - 1 ? null : <ChevronRight className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
