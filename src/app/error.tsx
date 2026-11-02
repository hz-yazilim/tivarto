"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sunucu tarafı hatalar yalnızca burada (istemcide) görünür; sunucu loglarına da düşer.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-5">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center">
        <h1 className="text-xl font-bold">Bir şeyler ters gitti</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          İşlem tamamlanamadı. Veritabanı bağlantısı yapılandırılmamış olabilir.
          Lütfen tekrar deneyin.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground">
            Hata kodu: {error.digest}
          </p>
        )}
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Tekrar dene
          </button>
          <a href="/" className="text-sm text-muted-foreground hover:underline">
            Ana sayfaya dön
          </a>
        </div>
      </div>
    </div>
  );
}
