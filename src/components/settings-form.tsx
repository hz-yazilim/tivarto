"use client";

import { useActionState } from "react";
import { updateSettingsAction } from "@/actions/settings";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface SettingsFormProps {
  initial: any;
}

export default function SettingsForm({ initial }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(updateSettingsAction, null);

  return (
    <>
      {state?.ok && (
        <div className="rounded-md bg-green-100 p-3 text-sm text-green-800 mb-4">
          Ayarlar kaydedildi.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Görünüm ve İçerik</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <form action={formAction} className="space-y-4 max-w-2xl">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="logoUrl">Logo Görsel URL</Label>
                <Input
                  id="logoUrl"
                  name="logoUrl"
                  defaultValue={initial?.logoUrl || ""}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="coverUrl">Kapak Görsel URL</Label>
                <Input
                  id="coverUrl"
                  name="coverUrl"
                  defaultValue={initial?.coverUrl || ""}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Açıklama</Label>
              <Input
                id="description"
                name="description"
                defaultValue={initial?.description || ""}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="theme">Tema</Label>
              <select
                id="theme"
                name="theme"
                defaultValue={initial?.theme || "default"}
                className="border rounded px-3 py-2 w-full"
              >
                <option value="default">Varsayılan</option>
                <option value="modern">Modern</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
            <Button type="submit" disabled={isPending} className="w-auto">
              Görünüm Ayarlarını Kaydet
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>İletişim Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <form action={formAction} className="space-y-4 max-w-2xl">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" name="phone" defaultValue={initial?.phone || ""} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="whatsapp">WhatsApp Numarası</Label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  defaultValue={initial?.whatsapp || ""}
                  placeholder="0532 123 45 67"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address">Adres</Label>
                <Input id="address" name="address" defaultValue={initial?.address || ""} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="mapsUrl">Google Haritalar Bağlantısı</Label>
              <Input
                id="mapsUrl"
                name="mapsUrl"
                defaultValue={initial?.mapsUrl || ""}
                placeholder="https://maps.google.com/..."
              />
            </div>
            <Button type="submit" disabled={isPending} className="w-auto">
              İletişim Ayarlarını Kaydet
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
