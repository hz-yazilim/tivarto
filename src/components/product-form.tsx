"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  toggleProductAction,
} from "@/actions/catalog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface ProductFormProps {
  categories: Array<{ id: string; name: string }>;
  mode?: "add" | "edit";
  initial?: any;
  onSuccess?: () => void;
}

export default function ProductForm({
  categories,
  mode = "add",
  initial,
  onSuccess,
}: ProductFormProps) {
  const action = mode === "edit" ? updateProductAction : createProductAction;
  const [state, formAction, isPending] = useActionState(action, null);
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || "");
  const [uploading, setUploading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (initial && !imageUrl) setImageUrl(initial.imageUrl || "");
  }, [initial, imageUrl]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.url) setImageUrl(json.url);
      else alert(json.error || "Yükleme başarısız.");
    } catch {
      alert("Yükleme sırasında hata oluştu.");
    } finally {
      setUploading(false);
    }
  }

  const isEdit = mode === "edit";

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-xl border p-5 bg-card"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{isEdit ? "Ürün Düzenle" : "Yeni Ürün Ekle"}</h3>
        {state?.error && (
          <span className="text-sm text-destructive">{state.error}</span>
        )}
      </div>

      {isEdit && <input type="hidden" name="id" value={initial?.id} />}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="name">Ürün Adı</Label>
          <Input id="name" name="name" defaultValue={initial?.name || ""} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="categoryId">Kategori</Label>
          <select id="categoryId" name="categoryId" defaultValue={initial?.categoryId || ""}>
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
          <Input id="sku" name="sku" defaultValue={initial?.sku || ""} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="barcode">Barkod</Label>
          <Input id="barcode" name="barcode" defaultValue={initial?.barcode || ""} />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Açıklama</Label>
        <Input id="description" name="description" defaultValue={initial?.description || ""} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="imageUrl">Görsel URL (veya aşağıdan yükle)</Label>
        <div className="flex gap-2">
          <Input
            id="imageUrl"
            name="imageUrl"
            defaultValue={imageUrl}
            placeholder="https://..."
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="flex-1"
          />
        </div>
        {imageUrl && (
          <div className="mt-2">
            <img src={imageUrl} alt="önizleme" className="h-20 w-20 rounded object-cover border" />
          </div>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor="buyPrice">Alış Fiyatı (TL)</Label>
          <Input id="buyPrice" name="buyPrice" type="number" step="0.01" defaultValue={initial?.buyPrice?.toString() || ""} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="sellPrice">Satış Fiyatı (TL)</Label>
          <Input id="sellPrice" name="sellPrice" type="number" step="0.01" defaultValue={initial?.sellPrice?.toString() || ""} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="stock">Stok Miktarı</Label>
          <Input id="stock" name="stock" type="number" defaultValue={initial?.stock?.toString() || "0"} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="minStock">Kritik Stok Eşiği</Label>
          <Input id="minStock" name="minStock" type="number" defaultValue={initial?.minStock?.toString() || "0"} />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3">
        <input
          id="isActive"
          name="isActive"
          type="checkbox"
          className="rounded border-primary"
          defaultChecked={initial?.isActive !== false}
        />
        <Label htmlFor="isActive">Aktif ürün</Label>
      </div>

      <Button type="submit" disabled={isPending || uploading} className="w-auto">
        {isEdit ? "Güncelle" : "Kaydet"}
      </Button>
      {isEdit && (
        <Button type="button" variant="outline" onClick={() => window.location.href = "/panel/products"} className="w-auto">
          İptal
        </Button>
      )}
    </form>
  );
}

export function ProductDeleteForm({ id }: { id: string }) {
  return (
    <form action={deleteProductAction} className="inline" onSubmit={(e) => {
      if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) e.preventDefault();
    }}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive" size="sm" className="ml-2">
        Sil
      </Button>
    </form>
  );
}

export function ProductToggle({ id, isActive }: { id: string; isActive: boolean }) {
  return (
    <form action={toggleProductAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="isActive" value={String(!isActive)} />
      <Button type="submit" variant="outline" size="sm">
        {isActive ? "Pasif Yap" : "Aktif Yap"}
      </Button>
    </form>
  );
}
