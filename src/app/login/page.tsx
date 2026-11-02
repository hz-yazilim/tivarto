import LoginForm from "@/components/login-form";
import DemoRoleSwitcher from "@/components/demo-role-switcher";
import { inferDemoRole, safeCallbackUrl } from "@/lib/constants";
import { DEMO_ACTIVE } from "@/lib/demo-config";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl: rawCallback } = await searchParams;
  const callbackUrl = safeCallbackUrl(rawCallback) ?? "";
  const defaultRole = inferDemoRole("", callbackUrl);

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mx-auto mb-8">
          <h2 className="text-2xl font-bold text-center">Tivarto</h2>
          <p className="text-center text-muted-foreground">
            Yönetim paneline giriş yapın
          </p>
        </div>

        <LoginForm
          demoActive={DEMO_ACTIVE}
          callbackUrl={callbackUrl}
          defaultRole={defaultRole}
        />

        {DEMO_ACTIVE && (
          <div className="mt-6">
            <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
              veya tek tıkla demo girişi
            </p>
            <DemoRoleSwitcher callbackUrl={callbackUrl} />
          </div>
        )}
      </div>
    </div>
  );
}
