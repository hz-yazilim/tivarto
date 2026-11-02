import LoginForm from "@/components/login-form";
import DemoRoleSwitcher from "@/components/demo-role-switcher";
import { safeCallbackUrl } from "@/lib/constants";
import { DEMO_ACTIVE } from "@/lib/demo-config";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl: rawCallback } = await searchParams;
  const callbackUrl = safeCallbackUrl(rawCallback) ?? "";

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mx-auto mb-8">
          <h2 className="text-2xl font-bold text-center">Tivarto</h2>
          <p className="text-center text-muted-foreground">
            Yönetim paneline giriş yapın
          </p>
        </div>

        {DEMO_ACTIVE ? (
          <div>
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <strong>Şifreyle giriş geçici olarak kapalı.</strong> Devam etmek
              için aşağıdan bir demo paneli seçin; herhangi bir e-posta veya
              şifre gerekmez.
            </div>
            <DemoRoleSwitcher callbackUrl={callbackUrl} />
          </div>
        ) : (
          <LoginForm
            demoActive={false}
            callbackUrl={callbackUrl}
            defaultRole="business"
          />
        )}
      </div>
    </div>
  );
}
