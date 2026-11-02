"use client";

import { useActionState } from "react";
import { createStorefrontOrderAction } from "@/actions/shop";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface OrderFormProps {
  tenantId: string;
}

export default function OrderForm({ tenantId }: OrderFormProps) {
  const [state, formAction, isPending] = useActionState(
    (prevState: any, formData: FormData) =>
      createStorefrontOrderAction(tenantId, prevState, formData),
    null
  );

  return (
    <>
      <Card className="mt-12">
        <CardHeader>
          <CardTitle>Hızlı Sipariş Ver</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          <form action={formAction} className="grid gap-3 md:grid-cols-3 items-end">
            {state?.error && (
              <div className="md:col-span-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {state.error}
              </div>
            )}
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="customerName">Ad Soyad</Label>
              <Input id="customerName" name="customerName" required />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="customerPhone">Telefon</Label>
              <Input id="customerPhone" name="customerPhone" required />
            </div>
            <div className="space-y-1 md:col-span-3">
              <Label htmlFor="customerAddress">Adres</Label>
              <Input id="customerAddress" name="customerAddress" />
            </div>
            <div className="space-y-1 md:col-span-3">
              <Label htmlFor="note">Not</Label>
              <Input id="note" name="note" />
            </div>
            <div className="md:col-span-3 flex items-end gap-2">
              <Button type="submit" disabled={isPending} className="w-full">
                Siparişi Oluştur ve WhatsApp'ta Paylaş
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {state?.ok && (
        <div className="mt-6 rounded-md bg-green-100 p-3 text-sm text-green-800">
          Sipariş oluşturuldu. WhatsApp bağlantısı hazır.
          <a
            href={state.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-primary underline"
          >
            WhatsApp'ta aç
          </a>
        </div>
      )}
    </>
  );
}
