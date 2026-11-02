"use client";

import { useActionState } from "react";
import { registerAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, null);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mx-auto mb-8">
          <h2 className="text-2xl font-bold text-center">Tivarto</h2>
          <p className="text-center text-muted-foreground">
            İşletmeniz için ücretsiz hesap oluşturun
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
              <Label htmlFor="name">Ad Soyad</Label>
              <Input id="name" name="name" placeholder="Ahmet Yılmaz" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" name="email" type="email" placeholder="isletme@ornek.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessName">İşletme Adı</Label>
              <Input id="businessName" name="businessName" placeholder="ABC Baharat" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slug">İnternet Mağazası Alt Alan Adı</Label>
              <Input id="slug" name="slug" placeholder="abcbaharat" />
              <p className="text-xs text-muted-foreground">
                Mağaza adresiniz: abcbaharat.platform.com
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" disabled={isPending} className="w-full">
              Hesap Oluştur
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Zaten hesabınız var mı?{" "}
            <a href="/login" className="font-medium hover:underline">
              Giriş yapın
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
