"use client";

import { useActionState, useState } from "react";
import { registerAction } from "@/actions/auth";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/validation";

export default function RegisterPage() {
  const [state, formAction] = useActionState<FormState, FormData>(
    registerAction,
    null
  );
  const [businessName, setBusinessName] = useState("");

  const suggested = businessName
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            T
          </div>
          <h1 className="text-2xl font-bold">Tiverto</h1>
          <p className="text-sm text-muted-foreground">
            İşletmeniz için ücretsiz hesap oluşturun
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form action={formAction} className="space-y-4">
            {state?.error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {state.error}
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="name">Ad Soyad</Label>
              <Input id="name" name="name" placeholder="Ahmet Yılmaz" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="isletme@ornek.com"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="businessName">İşletme Adı</Label>
              <Input
                id="businessName"
                name="businessName"
                placeholder="ABC Baharat"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slug">Mağaza Adresi</Label>
              <Input
                id="slug"
                name="slug"
                placeholder={suggested || "abcbaharat"}
                pattern="[a-z0-9-]{3,30}"
                title="3-30 karakter, sadece küçük harf, rakam ve tire"
                required
              />
              <p className="text-xs text-muted-foreground">
                Vitrininiz: <span className="font-medium">/shop/{"{adres}"}</span>
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Şifre (en az 8 karakter)</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <SubmitButton className="w-full">Hesap Oluştur</SubmitButton>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Zaten hesabınız var mı?{" "}
            <a href="/login" className="font-medium text-primary hover:underline">
              Giriş yapın
            </a>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Demo ortamıdır; gerçek müşteri bilgisi girmeyin.
        </p>
      </div>
    </main>
  );
}
