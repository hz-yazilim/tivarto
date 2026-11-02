import { cookies } from "next/headers";
import { demoSwitchRoleAction } from "@/actions/auth";
import {
  DEMO_EMAIL_COOKIE,
  DEMO_ROLE_COOKIE,
  DEMO_ROLE_LABELS,
  type DemoRole,
} from "@/lib/constants";
import { DEMO_ACTIVE } from "@/lib/demo-config";

const ROLES: DemoRole[] = ["admin", "business", "customer"];

const DESCRIPTIONS: Record<DemoRole, string> = {
  admin: "İşletmeler, planlar, ödemeler ve loglar",
  business: "Ürün, stok, sipariş ve mağaza ayarları",
  customer: "Siparişlerim ve alışveriş vitrini",
};

/**
 * Demo modunda üç panel arasında tek tıkla geçiş sağlar.
 * Gerçek modda (DEMO_ACTIVE=false) hiçbir şey render etmez.
 */
export default async function DemoRoleSwitcher({
  callbackUrl = "",
  compact = false,
}: {
  callbackUrl?: string;
  compact?: boolean;
}) {
  if (!DEMO_ACTIVE) return null;

  const cookieStore = await cookies();
  const current = cookieStore.get(DEMO_ROLE_COOKIE)?.value;
  const email = cookieStore.get(DEMO_EMAIL_COOKIE)?.value;

  return (
    <div
      className={
        compact
          ? "rounded-lg border border-amber-200 bg-amber-50 p-2"
          : "rounded-xl border border-amber-200 bg-amber-50 p-4"
      }
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
            Demo
          </span>
          <span className="text-xs font-medium text-amber-900">
            Paneller arasında geçiş yapın
          </span>
        </div>
        {email && (
          <span className="text-[11px] text-amber-800">
            Giriş: {email} <em>(bilgiler doğrulanmadı)</em>
          </span>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {ROLES.map((role) => {
          const active = current === role;
          return (
            <form action={demoSwitchRoleAction} key={role}>
              <input type="hidden" name="role" value={role} />
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
              <button
                type="submit"
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  active
                    ? "border-amber-400 bg-amber-100"
                    : "border-amber-200 bg-white hover:bg-amber-100/70"
                }`}
              >
                <span className="flex items-center justify-between gap-2 font-medium text-amber-950">
                  {DEMO_ROLE_LABELS[role]}
                  {active && (
                    <span className="text-[10px] font-semibold uppercase text-amber-700">
                      Aktif
                    </span>
                  )}
                </span>
                {!compact && (
                  <span className="mt-0.5 block text-[11px] text-amber-800">
                    {DESCRIPTIONS[role]}
                  </span>
                )}
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
