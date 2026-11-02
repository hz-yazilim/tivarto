import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center">
        <h1 className="text-xl font-bold">Sayfa bulunamadı</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Aradığınız sayfa veya mağaza mevcut değil. Bağlantıyı kontrol edin.
        </p>
        <div className="mt-5">
          <Link href="/">
            <Button>Ana sayfaya dön</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
