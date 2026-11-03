"use client";

import { useActionState, useState } from "react";
import { registerAction } from "@/actions/auth";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/validation";

export default function RegisterForm({ demoActive = false }: { demoActive?: boolean }) {
  const [state, formAction] = useActionState<FormState, FormData>(registerAction, null);
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

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

  function updateBusinessName(value: string) {
    setBusinessName(value);
    if (!slugEdited) setSlug(value.toLowerCase()
      .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
      .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30));
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full bg-purple-700/20 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-rose-700/10 blur-3xl" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <a href="/" className="mb-6 inline-flex items-center gap-3">
            <span className="tiverto-gradient flex h-11 w-11 items-center justify-center rounded-xl text-xl font-black text-white">T</span>
            <span className="text-2xl font-bold tracking-tight text-white">tiverto<span className="text-purple-300">.</span></span>
          </a>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-purple-300">İŞLETME HESABI</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">İşletme hesabını oluştur</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">İşletmeni yönetmeye başlamak için bilgilerini gir.</p>
        </div>

        <div className="tiverto-glass rounded-2xl p-5 sm:p-7">
          <form action={formAction} className="space-y-4">
            {state?.error && <div role="alert" className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">{state.error}</div>}
            <div className="space-y-1.5">
              <Label htmlFor="name">Ad Soyad</Label>
              <Input id="name" name="name" autoComplete="name" placeholder="Ahmet Yılmaz" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="isletme@ornek.com" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="businessName">İşletme Adı</Label>
              <Input id="businessName" name="businessName" autoComplete="organization" placeholder="ABC Baharat" value={businessName} onChange={(e) => updateBusinessName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Mağaza Adresi</Label>
              <Input id="slug" name="slug" value={slug} onChange={(e) => { setSlugEdited(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30)); }} placeholder={suggested || "abcbaharat"} pattern="[a-z0-9-]{3,30}" title="3-30 karakter, sadece küçük harf, rakam ve tire" required />
              <p className="text-xs text-zinc-400">Vitrin adresin: <span className="font-medium text-purple-300">/shop/{slug || suggested || "magaza-adin"}</span></p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Şifre (en az 8 karakter)</Label>
              <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
            </div>
            <SubmitButton className="tiverto-gradient w-full border-0 text-white">Ücretsiz Hesap Oluştur</SubmitButton>
          </form>
          <p className="mt-6 text-center text-sm text-zinc-400">Zaten hesabın var mı? <a href="/login" className="font-semibold text-purple-300 hover:underline">Giriş yap</a></p>
        </div>
        <p className="mt-5 text-center text-xs text-zinc-500">{demoActive ? "Demo verileri kullanılıyor; gerçek müşteri bilgisi girmeyin." : "Kayıt işlemiyle işletmen için bir hesap ve mağaza adresi oluşturulur."}</p>
      </div>
    </main>
  );
}
