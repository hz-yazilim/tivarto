"use client";

import { useActionState, useMemo, useState } from "react";
import { createStorefrontOrderAction } from "@/actions/shop";
import { SubmitButton } from "./ui/submit-button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { FormState } from "@/lib/validation";

interface ShopProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export default function StorefrontOrder({
  tenantId,
  tenantName,
  products,
  disabled,
}: {
  tenantId: string;
  tenantName: string;
  products: ShopProduct[];
  disabled?: boolean;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    (prev, formData) => createStorefrontOrderAction(tenantId, prev, formData),
    null
  );

  const [cart, setCart] = useState<Record<string, number>>({});

  const lines = useMemo(
    () =>
      products
        .filter((p) => (cart[p.id] ?? 0) > 0)
        .map((p) => ({
          ...p,
          quantity: Math.min(cart[p.id], Math.max(p.stock, 0)),
          lineTotal: p.price * Math.min(cart[p.id], Math.max(p.stock, 0)),
        })),
    [cart, products]
  );

  const total = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const payload = JSON.stringify(
    lines.map((l) => ({ productId: l.id, quantity: l.quantity }))
  );

  function setQuantity(productId: string, quantity: number, stock: number) {
    setCart((prev) => ({
      ...prev,
      [productId]: Math.max(0, Math.min(quantity, stock)),
    }));
  }

  return (
    <Card className="mt-10">
      <CardHeader>
        <CardTitle className="text-base">Sipariş Ver</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 p-5 pt-0">
        {disabled ? (
          <p className="text-sm text-muted-foreground">
            Mağaza şu anda sipariş kabul etmiyor.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">1. Ürün seçin</h3>
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sipariş verilebilecek ürün yok.
                </p>
              ) : (
                <div className="divide-y divide-border rounded-lg border border-input">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-2 p-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.price.toLocaleString("tr-TR")} TL ·{" "}
                          {p.stock > 0 ? `${p.stock} adet` : "Stokta yok"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label={`${p.name} azalt`}
                          className="h-8 w-8 rounded-md border border-input text-sm hover:bg-accent disabled:opacity-40"
                          disabled={!cart[p.id]}
                          onClick={() =>
                            setQuantity(p.id, (cart[p.id] ?? 0) - 1, p.stock)
                          }
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {cart[p.id] ?? 0}
                        </span>
                        <button
                          type="button"
                          aria-label={`${p.name} arttır`}
                          className="h-8 w-8 rounded-md border border-input text-sm hover:bg-accent disabled:opacity-40"
                          disabled={p.stock === 0 || (cart[p.id] ?? 0) >= p.stock}
                          onClick={() =>
                            setQuantity(p.id, (cart[p.id] ?? 0) + 1, p.stock)
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">2. İletişim bilgileri</h3>
              <form action={formAction} className="grid gap-3 md:grid-cols-2">
                <input type="hidden" name="items" value={payload} />
                {state?.error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive md:col-span-2">
                    {state.error}
                  </div>
                )}
                <div className="space-y-1">
                  <Label htmlFor="customerName">Ad Soyad *</Label>
                  <Input id="customerName" name="customerName" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="customerPhone">Telefon *</Label>
                  <Input
                    id="customerPhone"
                    name="customerPhone"
                    inputMode="tel"
                    placeholder="0532 123 45 67"
                    required
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="customerAddress">Adres</Label>
                  <Input id="customerAddress" name="customerAddress" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="note">Sipariş Notu</Label>
                  <Input id="note" name="note" />
                </div>

                <div className="flex items-center justify-between rounded-lg bg-secondary p-3 md:col-span-2">
                  <span className="text-sm text-muted-foreground">
                    {lines.length} ürün · Toplam
                  </span>
                  <span className="text-lg font-bold">
                    {total.toLocaleString("tr-TR")} TL
                  </span>
                </div>

                <div className="md:col-span-2">
                  <SubmitButton disabled={lines.length === 0 || Boolean(state?.ok)} className="w-full">
                    Siparişi Gönder
                  </SubmitButton>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Sipariş {tenantName} işletmesine iletilir. Ödeme sahada/teslimatta
                    yapılır; bu ekranda online ödeme alınmaz.
                  </p>
                </div>
              </form>
            </div>

            {state?.ok && (
              <div className="rounded-md bg-green-100 p-3 text-sm text-green-800">
                {state.message}
                {state.whatsappUrl && (
                  <a
                    href={state.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block font-medium text-primary underline"
                  >
                    Sipariş özetini WhatsApp&apos;ta gönder →
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
