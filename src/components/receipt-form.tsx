"use client";

import { useActionState, useState } from "react";
import { createGoodsReceiptAction } from "@/actions/receipts";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface ReceiptItem {
  productId: string;
  expectedQuantity: number;
  receivedQuantity: number;
  missingQuantity: number;
  damagedQuantity: number;
  note: string;
}

interface ReceiptFormProps {
  products: Array<{ id: string; name: string }>;
  suppliers: Array<{ id: string; name: string }>;
}

const EMPTY_ITEM: ReceiptItem = {
  productId: "",
  expectedQuantity: 0,
  receivedQuantity: 0,
  missingQuantity: 0,
  damagedQuantity: 0,
  note: "",
};

export default function ReceiptForm({
  products,
  suppliers,
}: ReceiptFormProps) {
  const [state, formAction, isPending] = useActionState(createGoodsReceiptAction, null);
  const [items, setItems] = useState<ReceiptItem[]>([EMPTY_ITEM]);
  const [supplierId, setSupplierId] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [note, setNote] = useState("");

  function addItem() {
    setItems([...items, { ...EMPTY_ITEM }]);
  }
  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }
  function setItemField(i: number, field: keyof ReceiptItem, value: string | number) {
    setItems(items.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  }

  const itemsJSON = JSON.stringify(items);

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
          <select
            id="supplierId"
            name="supplierId"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full border rounded px-2 py-2"
          >
            <option value="">Seçiniz</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="status">Durum</Label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border rounded px-2 py-2"
          >
            <option value="PENDING">Beklemede</option>
            <option value="RECEIVED">Tam Alındı</option>
            <option value="PARTIAL">Kısmi Alındı</option>
            <option value="CANCELLED">İptal</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="note">Açıklama</Label>
          <Input
            id="note"
            name="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Ürünler</h4>
          <Button type="button" size="sm" onClick={addItem}>
            + Ürün Ekle
          </Button>
        </div>
        {items.map((it, i) => (
          <div key={i} className="grid gap-2 md:grid-cols-6 border p-3 rounded bg-secondary/50">
            <div>
              <Label className="text-xs block">Ürün</Label>
              <select
                name={`items[${i}].productId`}
                value={it.productId}
                onChange={(e) => setItemField(i, "productId", e.target.value)}
                className="w-full border rounded px-2 py-1 text-xs"
              >
                <option value="">Seçiniz</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs block">Beklenen</Label>
              <Input
                name={`items[${i}].expectedQuantity`}
                type="number"
                min="0"
                value={it.expectedQuantity}
                onChange={(e) => setItemField(i, "expectedQuantity", Number(e.target.value) || 0)}
                className="text-xs h-8"
              />
            </div>
            <div>
              <Label className="text-xs block">Teslim Alınan</Label>
              <Input
                name={`items[${i}].receivedQuantity`}
                type="number"
                min="0"
                value={it.receivedQuantity}
                onChange={(e) => setItemField(i, "receivedQuantity", Number(e.target.value) || 0)}
                className="text-xs h-8"
              />
            </div>
            <div>
              <Label className="text-xs block">Eksik</Label>
              <Input
                name={`items[${i}].missingQuantity`}
                type="number"
                min="0"
                value={it.missingQuantity}
                onChange={(e) => setItemField(i, "missingQuantity", Number(e.target.value) || 0)}
                className="text-xs h-8"
              />
            </div>
            <div>
              <Label className="text-xs block">Hasarlı</Label>
              <Input
                name={`items[${i}].damagedQuantity`}
                type="number"
                min="0"
                value={it.damagedQuantity}
                onChange={(e) => setItemField(i, "damagedQuantity", Number(e.target.value) || 0)}
                className="text-xs h-8"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeItem(i)}
              >
                Kaldır
              </Button>
            </div>
          </div>
        ))}
      </div>

      <input type="hidden" name="supplierId" value={supplierId} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="note" value={note} />
      <input type="hidden" name="items" value={itemsJSON} />

      <Button type="submit" disabled={isPending || items.length === 0}>
        Kaydı Oluştur
      </Button>
    </form>
  );
}
