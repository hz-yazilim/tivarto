import { importProductsCsvAction } from '@/actions/imports';

export default function ProductImportForm() {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">CSV ile toplu ürün aktarımı</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Ürünlerini tek tek girmek yerine Excel veya Google Sheets dosyanı CSV olarak yükle. Açılış stokları stok hareketlerine de kaydedilir.
          </p>
        </div>
        <a href="/ornek-urunler.csv" download className="text-sm font-semibold text-primary hover:underline">
          Örnek CSV şablonunu indir
        </a>
      </div>
      <form action={importProductsCsvAction} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 space-y-1 text-sm font-medium">
          CSV dosyası
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
        </label>
        <button type="submit" className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
          Ürünleri içe aktar
        </button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">
        UTF-8 CSV biçimi; virgül veya noktalı virgül ayraç desteklenir. En fazla 500 ürün ve 2 MB. Zorunlu alanlar: ürün adı ve satış fiyatı. Aynı SKU veya barkod varsa aktarım durdurulur.
      </p>
    </section>
  );
}
