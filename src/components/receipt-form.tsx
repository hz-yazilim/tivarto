"use client";

import { useActionState, useState } from "react";
import { createGoodsReceiptAction } from "@/actions/receipts";
import { Button } from "./ui/button";
import { SubmitButton } from "./ui/submit-button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import type { FormState } from "@/lib/validation";

interface ReceiptItem {
  productId: string;
  expectedQuantity: number;
  receivedQuantity: number;
  missingQuantity: number;
  damagedQuantity: number;
}

const EMPTY_ITEM: ReceiptItem = {
  productId: "",
  expectedQuantity: 0,
  receivedQuantity: 0,
  missingQuantity: 0,
  damagedQuantity: 0,
};

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function ReceiptForm({
  products,
  suppliers,
}: {
  products: Array<{ id: string; name: string }>;
  suppliers: Array<{ id: string; name: string }>;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    createGoodsReceiptAction,
    null
  );
  const [items, setItems] = useState<ReceiptItem[]>([{ ...EMPTY_ITEM }]);

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function setItemField<K extends keyof ReceiptItem>(
    index: number,
    field: K,
    value: ReceiptItem[K]
  ) {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: value } : it))
    );
  }

  const validItems = items.filter((it) => it.productId);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="supplierId">Tedarikçi</Label>
          <select id="supplierId" name="supplierId" className={selectClass}>
            <option value="">Seçiniz</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="status">Durum</Label>
          <select
            id="status"
            name="status"
            defaultValue="RECEIVED"
            className={selectClass}
          >
            <option value="PENDING">Beklemede (stoğa eklenmez)</option>
            <option value="RECEIVED">Tam Alındı (stoğa eklenir)</option>
            <option value="PARTIAL">Kısmi Alındı (stoğa eklenir)</option>
            <option value="CANCELLED">İptal (stoğa eklenmez)</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="note">Açıklama</Label>
          <Input id="note" name="note" placeholder="İrsaliye no vb." />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Ürünler</h3>
          <Button type="button" size="sm" variant="outline" onClick={addItem}>
            + Ürün Ekle
          </Button>
        </div>

        {items.map((it, i) => (
          <div
            key={i}
            className="grid gap-2 rounded-lg border border-input bg-secondary/40 p-3 md:grid-cols-6"
          >
            <div className="md:col-span-2">
              <Label className="mb-1 block text-xs">Ürün</Label>
              <select
                value={it.productId}
                onChange={(e) => setItemField(i, "productId", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="">Seçiniz</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Beklenen</Label>
              <Input
                type="number"
                min="0"
                value={it.expectedQuantity}
                onChange={(e) =>
                  setItemField(i, "expectedQuantity", Number(e.target.value) || 0)
                }
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Teslim Alınan</Label>
              <Input
                type="number"
                min="0"
                value={it.receivedQuantity}
                onChange={(e) =>
                  setItemField(i, "receivedQuantity", Number(e.target.value) || 0)
                }
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Eksik</Label>
              <Input
                type="number"
                min="0"
                value={it.missingQuantity}
                onChange={(e) =>
                  setItemField(i, "missingQuantity", Number(e.target.value) || 0)
                }
                className="h-9 text-xs"
              />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="mb-1 block text-xs">Hasarlı</Label>
                <Input
                  type="number"
                  min="0"
                  value={it.damagedQuantity}
                  onChange={(e) =>
                    setItemField(i, "damagedQuantity", Number(e.target.value) || 0)
                  }
                  className="h-9 text-xs"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeItem(i)}
                disabled={items.length === 1}
                aria-label="Satırı kaldır"
              >
                ×
              </Button>
            </div>
          </div>
        ))}
      </div>

      <input type="hidden" name="items" value={JSON.stringify(validItems)} />

      <SubmitButton disabled={validItems.length === 0}>Kaydı Oluştur</SubmitButton>
    </form>
  );
}
