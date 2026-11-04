"use server";

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireWritableTenantContext } from '@/lib/session.server';
import { withTenant } from '@/lib/db';

type CsvProduct = {
  name: string;
  sku: string | null;
  barcode: string | null;
  buyPrice: number | null;
  sellPrice: number;
  stock: number;
  minStock: number;
  description: string | null;
};

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[\s_-]+/g, '');
}

function detectCsvDelimiter(input: string): ',' | ';' {
  let quoted = false;
  let commas = 0;
  let semicolons = 0;
  for (let index = 0; index < input.length && input[index] !== '\n'; index += 1) {
    const char = input[index];
    if (char === '"' && input[index + 1] === '"' && quoted) {
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char === ',') {
      commas += 1;
    } else if (!quoted && char === ';') {
      semicolons += 1;
    }
  }
  return semicolons > commas ? ';' : ',';
}

function parseCsvRows(input: string): string[][] {
  const delimiter = detectCsvDelimiter(input);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      if (row.some((cell) => cell.trim().length > 0)) rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\\r') {
      field += char;
    }
  }

  if (quoted) throw new Error('CSV dosyasında kapatılmamış tırnak işareti var.');
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.trim().length > 0)) rows.push(row);
  }
  return rows;
}

function parseAmount(value: string, fieldName: string): number | null {
  const raw = value.trim();
  if (!raw) return null;
  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 9999999999.99) {
    throw new Error(fieldName + ' alanında geçersiz veya desteklenen sınırı aşan tutar var: ' + raw);
  }
  return Math.round(parsed * 100) / 100;
}

function parseInteger(value: string, fieldName: string): number {
  const raw = value.trim();
  if (!raw) return 0;
  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > 2147483647) {
    throw new Error(fieldName + ' alanı 0 ile 2.147.483.647 arasında tam sayı olmalı: ' + raw);
  }
  return parsed;
}

function parseProducts(csv: string): CsvProduct[] {
  const rows = parseCsvRows(csv.replace(/^\uFEFF/, ''));
  if (rows.length < 2) throw new Error('CSV dosyasında başlık satırı ve en az bir ürün olmalı.');

  const aliases: Record<string, keyof CsvProduct> = {
    name: 'name',
    productname: 'name',
    urun: 'name',
    urunadi: 'name',
    sku: 'sku',
    barkod: 'barcode',
    barcode: 'barcode',
    buyprice: 'buyPrice',
    alisfiyati: 'buyPrice',
    sellprice: 'sellPrice',
    satisfiyati: 'sellPrice',
    stock: 'stock',
    stok: 'stock',
    minstock: 'minStock',
    minimumstok: 'minStock',
    description: 'description',
    aciklama: 'description',
  };

  const columns = rows[0].map((header) => aliases[normalizeHeader(header)] ?? null);
  const nameIndex = columns.indexOf('name');
  const sellPriceIndex = columns.indexOf('sellPrice');
  if (nameIndex < 0 || sellPriceIndex < 0) {
    throw new Error('CSV başlıklarında name (veya urunAdi) ile sellPrice (veya satisFiyati) zorunludur.');
  }

  const products: CsvProduct[] = [];
  for (const [rowIndex, row] of rows.slice(1).entries()) {
    if (!row.some((cell) => cell.trim())) continue;
    const get = (key: keyof CsvProduct) => {
      const index = columns.indexOf(key);
      return index < 0 ? '' : (row[index] ?? '').trim();
    };

    const name = get('name');
    if (!name || name.length > 160) {
      throw new Error((rowIndex + 2) + '. satırda ürün adı boş veya 160 karakterden uzun.');
    }
    const sellPrice = parseAmount(get('sellPrice'), 'Satış fiyatı');
    if (sellPrice === null) throw new Error((rowIndex + 2) + '. satırda satış fiyatı zorunludur.');
    const buyPrice = parseAmount(get('buyPrice'), 'Alış fiyatı');
    const sku = get('sku') || null;
    const barcode = get('barcode') || null;
    const description = get('description') || null;
    if (sku && sku.length > 100) throw new Error((rowIndex + 2) + '. satırdaki SKU çok uzun.');
    if (barcode && barcode.length > 100) throw new Error((rowIndex + 2) + '. satırdaki barkod çok uzun.');
    if (description && description.length > 2000) throw new Error((rowIndex + 2) + '. satırdaki açıklama çok uzun.');

    products.push({
      name,
      sku,
      barcode,
      buyPrice,
      sellPrice,
      stock: parseInteger(get('stock'), 'Stok'),
      minStock: parseInteger(get('minStock'), 'Minimum stok'),
      description,
    });
  }

  if (products.length === 0) throw new Error('Aktarılacak ürün bulunamadı.');
  if (products.length > 500) throw new Error('Tek seferde en fazla 500 ürün aktarabilirsiniz.');

  const skus = products.map((product) => product.sku).filter((value): value is string => Boolean(value));
  const barcodes = products.map((product) => product.barcode).filter((value): value is string => Boolean(value));
  if (new Set(skus.map((value) => value.toLowerCase())).size !== skus.length) {
    throw new Error('CSV içinde aynı SKU birden fazla kez kullanılmış.');
  }
  if (new Set(barcodes.map((value) => value.toLowerCase())).size !== barcodes.length) {
    throw new Error('CSV içinde aynı barkod birden fazla kez kullanılmış.');
  }
  return products;
}

export async function importProductsCsvAction(formData: FormData): Promise<void> {
  const { tenant, user } = await requireWritableTenantContext();
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    redirect('/panel/products?importError=' + encodeURIComponent('Lütfen bir CSV dosyası seçin.'));
  }
  if (!file.name.toLowerCase().endsWith('.csv') || file.size > 2 * 1024 * 1024) {
    redirect('/panel/products?importError=' + encodeURIComponent('Yalnızca 2 MB boyutuna kadar CSV dosyası yükleyebilirsiniz.'));
  }

  let products: CsvProduct[];
  try {
    products = parseProducts(await file.text());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'CSV dosyası okunamadı.';
    redirect('/panel/products?importError=' + encodeURIComponent(message.slice(0, 220)));
  }

  const result = await withTenant(tenant.id, async (tx) => {
    const [currentCount, plan] = await Promise.all([
      tx.product.count({ where: { tenantId: tenant.id } }),
      tx.plan.findUnique({ where: { id: tenant.planId }, select: { maxProducts: true } }),
    ]);
    if (plan && currentCount + products.length > plan.maxProducts) {
      return { error: 'Paket ürün limitiniz yetersiz. Mevcut: ' + currentCount + ', aktarılacak: ' + products.length + ', limit: ' + plan.maxProducts + '.' };
    }

    const existingIdentifiers = await tx.product.findMany({
      where: { tenantId: tenant.id },
      select: { sku: true, barcode: true },
    });
    const existingSkus = new Set(existingIdentifiers.map((item) => item.sku?.trim().toLowerCase()).filter(Boolean));
    const existingBarcodes = new Set(existingIdentifiers.map((item) => item.barcode?.trim().toLowerCase()).filter(Boolean));
    const duplicateSku = products.find((product) => product.sku && existingSkus.has(product.sku.toLowerCase()));
    const duplicateBarcode = products.find((product) => product.barcode && existingBarcodes.has(product.barcode.toLowerCase()));
    if (duplicateSku || duplicateBarcode) {
      return {
        error: duplicateSku
          ? 'Bu SKU işletmenizde zaten kayıtlı: ' + duplicateSku.sku
          : 'Bu barkod işletmenizde zaten kayıtlı: ' + duplicateBarcode?.barcode,
      };
    }

    for (const item of products) {
      const product = await tx.product.create({
        data: {
          tenantId: tenant.id,
          name: item.name,
          sku: item.sku,
          barcode: item.barcode,
          buyPrice: item.buyPrice,
          sellPrice: item.sellPrice,
          stock: item.stock,
          minStock: item.minStock,
          description: item.description,
          isActive: true,
        },
      });

      if (item.stock > 0) {
        await tx.stockMovement.create({
          data: {
            tenantId: tenant.id,
            productId: product.id,
            type: 'IN',
            quantity: item.stock,
            note: 'CSV toplu ürün aktarımı — açılış stoğu',
            createdBy: user.id,
          },
        });
      }
      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          action: 'product.imported',
          entity: 'Product',
          entityId: product.id,
          details: 'CSV toplu aktarımı',
        },
      });
    }
    return { created: products.length };
  });

  if ('error' in result && typeof result.error === 'string') {
    redirect('/panel/products?importError=' + encodeURIComponent(result.error));
  }
  if (!('created' in result) || typeof result.created !== 'number') {
    redirect('/panel/products?importError=' + encodeURIComponent('Ürün aktarımı tamamlanamadı.'));
  }
  revalidatePath('/panel/products');
  revalidatePath('/panel/stock');
  revalidatePath('/panel/reports');
  redirect('/panel/products?imported=' + result.created);
}
