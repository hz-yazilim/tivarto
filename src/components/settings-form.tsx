"use client";

import { useActionState } from "react";
import { updateSettingsAction } from "@/actions/settings";
import { SubmitButton } from "./ui/submit-button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { FormState } from "@/lib/validation";

export interface StoreSettingsValues {
  logoUrl: string | null;
  coverUrl: string | null;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  mapsUrl: string | null;
  theme: string;
}

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function SettingsForm({
  initial,
}: {
  initial: StoreSettingsValues | null;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    updateSettingsAction,
    null
  );

  return (
    <form action={formAction} className="space-y-6">
      {state?.ok && (
        <div className="rounded-md bg-green-100 p-3 text-sm text-green-800">
          {state.message ?? "Ayarlar kaydedildi."}
        </div>
      )}
      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Görünüm ve İçerik</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="grid max-w-2xl gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="logoUrl">Logo Görsel URL</Label>
                <Input
                  id="logoUrl"
                  name="logoUrl"
                  defaultValue={initial?.logoUrl ?? ""}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="coverUrl">Kapak Görsel URL</Label>
                <Input
                  id="coverUrl"
                  name="coverUrl"
                  defaultValue={initial?.coverUrl ?? ""}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Mağaza Açıklaması</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={initial?.description ?? ""}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="theme">Tema</Label>
              <select
                id="theme"
                name="theme"
                defaultValue={initial?.theme ?? "default"}
                className={selectClass}
              >
                <option value="default">Varsayılan</option>
                <option value="modern">Modern</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">İletişim Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="grid max-w-2xl gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={initial?.phone ?? ""}
                  placeholder="0532 123 45 67"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="whatsapp">WhatsApp Numarası</Label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  defaultValue={initial?.whatsapp ?? ""}
                  placeholder="905321234567"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address">Adres</Label>
                <Input id="address" name="address" defaultValue={initial?.address ?? ""} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="mapsUrl">Google Haritalar Bağlantısı</Label>
              <Input
                id="mapsUrl"
                name="mapsUrl"
                defaultValue={initial?.mapsUrl ?? ""}
                placeholder="https://maps.google.com/..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <SubmitButton>Tüm Ayarları Kaydet</SubmitButton>
    </form>
  );
}
