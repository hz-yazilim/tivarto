"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  toggleProductAction,
} from "@/actions/catalog";
import { Button } from "./ui/button";
import { SubmitButton } from "./ui/submit-button";
import { ConfirmSubmitButton } from "./ui/confirm-submit-button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import type { FormState } from "@/lib/validation";

export interface ProductFormValues {
  id: string;
  name: string;
  categoryId: string | null;
  sku: string | null;
  barcode: string | null;
  description: string | null;
  imageUrl: string | null;
  buyPrice: string;
  sellPrice: string;
  stock: number;
  minStock: number;
  isActive: boolean;
}

interface ProductFormProps {
  categories: Array<{ id: string; name: string }>;
  mode?: "add" | "edit";
  initial?: ProductFormValues;
}

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function ProductForm({
  categories,
  mode = "add",
  initial,
}: ProductFormProps) {
  const action = mode === "edit" ? updateProductAction : createProductAction;
  const [state, formAction] = useActionState<FormState, FormData>(action, null);
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    setImageUrl(initial?.imageUrl ?? "");
  }, [initial?.imageUrl]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = (await res.json()) as { url?: string; error?: string };
      if (json.url) setImageUrl(json.url);
      else setUploadError(json.error ?? "Yükleme başarısız.");
    } catch {
      setUploadError("Yükleme sırasında hata oluştu.");
    } finally {
      setUploading(false);
    }
  }

  const isEdit = mode === "edit";

  return (
    <form action={formAction} className="space-y-4 rounded-xl bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">
          {isEdit ? "Ürün Düzenle" : "Yeni Ürün Ekle"}
        </h2>
        {state?.error && (
          <span className="text-sm text-destructive">{state.error}</span>
        )}
      </div>

      {isEdit && <input type="hidden" name="id" value={initial?.id} />}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="name">Ürün Adı *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={initial?.name ?? ""}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="categoryId">Kategori</Label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={initial?.categoryId ?? ""}
            className={selectClass}
          >
            <option value="">Kategori yok</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="sku">Stok Kodu (SKU)</Label>
          <Input id="sku" name="sku" defaultValue={initial?.sku ?? ""} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="barcode">Barkod</Label>
          <Input id="barcode" name="barcode" defaultValue={initial?.barcode ?? ""} />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Açıklama</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initial?.description ?? ""}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="imageUrl">Görsel URL (veya dosya yükleyin)</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="imageUrl"
            name="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
          />
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleImageUpload}
            disabled={uploading}
            className="text-sm"
          />
        </div>
        {uploading && (
          <p className="text-xs text-muted-foreground">Görsel yükleniyor...</p>
        )}
        {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Ürün görseli önizleme"
            className="mt-2 h-20 w-20 rounded-md border object-cover"
          />
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor="buyPrice">Alış Fiyatı (TL)</Label>
          <Input
            id="buyPrice"
            name="buyPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initial?.buyPrice ?? ""}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="sellPrice">Satış Fiyatı (TL) *</Label>
          <Input
            id="sellPrice"
            name="sellPrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initial?.sellPrice ?? ""}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="stock">Stok Miktarı</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            defaultValue={initial?.stock ?? 0}
            readOnly={isEdit}
            className={isEdit ? "bg-muted" : undefined}
          />
          {isEdit && (
            <p className="text-xs text-muted-foreground">
              Stok, Stok sayfasından güncellenir.
            </p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="minStock">Kritik Stok Eşiği</Label>
          <Input
            id="minStock"
            name="minStock"
            type="number"
            min="0"
            defaultValue={initial?.minStock ?? 0}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input
          id="isActive"
          name="isActive"
          type="checkbox"
          className="h-4 w-4 rounded border-input"
          defaultChecked={initial?.isActive ?? true}
        />
        <Label htmlFor="isActive">Vitrinde yayınla (aktif ürün)</Label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton disabled={uploading}>
          {isEdit ? "Güncelle" : "Kaydet"}
        </SubmitButton>
        {isEdit && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              window.location.href = "/panel/products";
            }}
          >
            İptal
          </Button>
        )}
      </div>
    </form>
  );
}

export function ProductDeleteForm({ id }: { id: string }) {
  return (
    <form action={deleteProductAction}>
      <input type="hidden" name="id" value={id} />
      <ConfirmSubmitButton
                      variant="destructive"
                      size="sm"
                      message="Bu ürünü silmek istediğinize emin misiniz? Siparişi olan ürünler silinmez, pasife alınır."
                    >
        Sil
      </ConfirmSubmitButton>
    </form>
  );
}

export function ProductToggle({ id, isActive }: { id: string; isActive: boolean }) {
  return (
    <form action={toggleProductAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="isActive" value={String(!isActive)} />
      <SubmitButton variant="outline" size="sm">
        {isActive ? "Pasif Yap" : "Aktif Yap"}
      </SubmitButton>
    </form>
  );
}
