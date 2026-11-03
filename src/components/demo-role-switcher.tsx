import { cookies } from "next/headers";
import { demoSwitchRoleAction } from "@/actions/auth";
import {
  DEMO_EMAIL_COOKIE,
  DEMO_ROLE_COOKIE,
  DEMO_ROLE_LABELS,
  type DemoRole,
} from "@/lib/constants";
import { DEMO_ACTIVE } from "@/lib/demo-config";

const PUBLIC_ROLES: DemoRole[] = ["business", "customer"];
const ADMIN_ROLES: DemoRole[] = ["admin", "business", "customer"];

const DESCRIPTIONS: Record<DemoRole, string> = {
  admin: "İşletmeler, planlar, ödemeler ve loglar",
  business: "Ürün, stok, sipariş ve mağaza ayarları",
  customer: "Siparişlerim ve alışveriş vitrini",
};

/** Demo rol seçimi: yönetici rolü yalnızca zaten yönetici alanında gösterilir. */
export default async function DemoRoleSwitcher({
  callbackUrl = "",
  compact = false,
  includeAdmin = false,
}: {
  callbackUrl?: string;
  compact?: boolean;
  includeAdmin?: boolean;
}) {
  if (!DEMO_ACTIVE) return null;

  const cookieStore = await cookies();
  const current = cookieStore.get(DEMO_ROLE_COOKIE)?.value;
  const email = cookieStore.get(DEMO_EMAIL_COOKIE)?.value;
  const roles = includeAdmin ? ADMIN_ROLES : PUBLIC_ROLES;

  return (
    <div className={compact
      ? "rounded-xl border border-purple-400/20 bg-[#171124] p-3"
      : "rounded-2xl border border-purple-400/20 bg-[#171124] p-4 sm:p-5"
    }>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-purple-400/30 bg-purple-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-200">
            Demo
          </span>
          <span className="text-xs font-medium text-zinc-200">
            {includeAdmin ? "Demo panelleri arasında geçiş" : "Örnek hesabı seç"}
          </span>
        </div>
        {email && (
          <span className="text-[11px] text-zinc-400">
            Oturum: {email} <em>(örnek hesap)</em>
          </span>
        )}
      </div>
      <div className={compact ? "grid gap-2 sm:grid-cols-3" : "grid gap-2 sm:grid-cols-2"}>
        {roles.map((role) => {
          const active = current === role;
          return (
            <form action={demoSwitchRoleAction} key={role}>
              <input type="hidden" name="role" value={role} />
              <input type="hidden" name="callbackUrl" value={callbackUrl} />
              <button
                type="submit"
                className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-purple-300 ${
                  active
                    ? "border-purple-400/60 bg-purple-500/20 text-white"
                    : "border-white/10 bg-white/[0.03] text-zinc-200 hover:border-purple-400/40 hover:bg-purple-500/10"
                }`}
              >
                <span className="flex items-center justify-between gap-2 font-semibold">
                  {DEMO_ROLE_LABELS[role]}
                  {active && <span className="text-[10px] font-bold uppercase tracking-wide text-purple-200">Aktif</span>}
                </span>
                {!compact && <span className="mt-1 block text-xs leading-5 text-zinc-400">{DESCRIPTIONS[role]}</span>}
              </button>
            </form>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] leading-5 text-zinc-500">
        Demo verileri örnektir; bu oturumda yapılan değişiklikler kalıcı değildir.
      </p>
    </div>
  );
}
