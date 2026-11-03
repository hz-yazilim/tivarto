"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DemoRole } from "@/lib/constants";

export default function LoginForm({
  demoActive,
  callbackUrl,
  defaultRole,
}: {
  demoActive: boolean;
  callbackUrl: string;
  defaultRole: DemoRole;
}) {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      {demoActive && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <strong>Demo modu:</strong> E-posta ve şifre doğrulanmaz; istediğiniz
          bilgileri yazarak giriş yapabilirsiniz. Veritabanı bağlandığında bu
          kolaylık otomatik kapanır.
        </div>
      )}
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        {state?.error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {state.error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">E-posta</Label>
          <Input id="email" name="email" type="email" placeholder="isletme@ornek.com" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Şifre</Label>
          <Input id="password" name="password" type="password" required />
        </div>
        {demoActive && (
          <div className="space-y-2">
            <Label htmlFor="role">Açılacak panel</Label>
            <select
              id="role"
              name="role"
              defaultValue={defaultRole}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="admin">Platform Yöneticisi → /admin</option>
              <option value="business">İşletme Yetkilisi → /panel</option>
              <option value="customer">Müşteri → /musteri ve vitrin</option>
            </select>
          </div>
        )}
        <Button type="submit" disabled={isPending} className="w-full">
          Giriş Yap
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Henüz hesabınız yok mu?{" "}
        <a href="/register" className="font-medium hover:underline">
          Hesap oluşturun
        </a>
      </p>
    </div>
  );
}
