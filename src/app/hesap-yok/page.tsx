import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NoAccountPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center">
        <h1 className="text-xl font-bold">İşletme hesabı bulunamadı</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Oturumunuz açık ancak bağlı bir işletme kaydı yok. Yeni bir işletme
          oluşturabilir veya çıkış yapıp tekrar giriş yapabilirsiniz.
        </p>
        <div className="mt-6 flex flex-col items-center gap-2">
          <Link href="/register" className="w-full">
            <Button className="w-full">Yeni işletme oluştur</Button>
          </Link>
          <a href="/logout" className="text-sm text-muted-foreground hover:underline">
            Çıkış yap
          </a>
        </div>
      </div>
    </main>
  );
}
