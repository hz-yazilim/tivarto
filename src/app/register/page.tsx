import { demoSwitchRoleAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import RegisterForm from "@/app/register/register-form";
import { DEMO_ACTIVE } from "@/lib/demo-config";

export default function RegisterPage() {
  if (!DEMO_ACTIVE) return <RegisterForm />;

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            T
          </div>
          <h1 className="text-2xl font-bold">Tiverto</h1>
          <p className="text-sm text-muted-foreground">Demo paneline hemen başlayın</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <h2 className="text-lg font-semibold text-amber-950">Demo ortamı</h2>
          <p className="mt-2 text-sm text-amber-900">
            Şu anda hesap/veritabanı kurulumu etkin değil. Form doldurmak yerine
            örnek işletme panelini tek dokunuşla açabilirsiniz.
          </p>
          <form action={demoSwitchRoleAction} className="mt-5">
            <input type="hidden" name="role" value="business" />
            <input type="hidden" name="callbackUrl" value="/panel" />
            <Button type="submit" size="lg" className="w-full">
              Demo işletme panelini aç
            </Button>
          </form>
          <a
            href="/login"
            className="mt-5 inline-block text-sm font-medium text-primary hover:underline"
          >
            Diğer giriş seçenekleri
          </a>
        </div>
      </div>
    </main>
  );
}
