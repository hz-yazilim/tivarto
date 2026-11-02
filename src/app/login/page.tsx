"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mx-auto mb-8">
          <h2 className="text-2xl font-bold text-center">Tivarto</h2>
          <p className="text-center text-muted-foreground">
            Yönetim paneline giriş yapın
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <form action={formAction} className="space-y-4">
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
            <Button type="submit" disabled={isPending} className="w-full">
              Giriş Yap
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Henüz hesabınız yok mu?{" "}
            <a href="/register" className="font-medium hover:underline">
              Ücretsiz oluşturun
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
