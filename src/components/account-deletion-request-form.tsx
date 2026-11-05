"use client";

import { useState, type FormEvent } from "react";

export default function AccountDeletionRequestForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/account-deletion/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Talep gönderilemedi.");
      setMessage(data.message || "Talebiniz alındı. E-posta kutunuzu kontrol edin.");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Talep gönderilemedi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <label className="block space-y-2 text-sm">
        <span className="font-medium">Tivarto hesabınıza kayıtlı e-posta adresi</span>
        <input
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-12 w-full rounded-xl border border-white/15 bg-black/20 px-3 text-white outline-none focus:border-purple-400"
          placeholder="ornek@eposta.com"
        />
      </label>
      {message && <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{message}</p>}
      {error && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
      <button disabled={busy} type="submit" className="h-12 w-full rounded-xl bg-purple-600 px-4 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-60">
        {busy ? "Talep gönderiliyor..." : "Hesap silme talebi gönder"}
      </button>
    </form>
  );
}
