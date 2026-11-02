import { prisma } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import OrderForm from "@/components/order-form";

interface ProductItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sellPrice: number;
  stock: number;
  category: { name: string } | null;
}

async function fetchStorefrontData(slug: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { storeSettings: true },
  });
  if (!tenant) return null;
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }),
    prisma.category.findMany({ where: { tenantId: tenant.id }, orderBy: { sortOrder: "asc" } }),
  ]);
  return {
    tenantId: tenant.id,
    products: products.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      imageUrl: p.imageUrl,
      sellPrice: Number(p.sellPrice),
      stock: p.stock,
      category: p.category,
    })),
    categories: categories.map((c: any) => ({ id: c.id, name: c.name })),
    settings: tenant.storeSettings,
    tenantName: tenant.name,
  };
}

export default async function ShopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await fetchStorefrontData(slug);
  if (!data) notFound();

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <nav className="mb-6 flex items-center gap-2">
        <Link href="/">
          <Button variant="ghost" size="sm">← Ana Sayfa</Button>
        </Link>
      </nav>

      <header className="mb-8 text-center">
        <div
          className="mx-auto h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold mb-3"
        >
          {data.tenantName.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-3xl font-bold">{data.tenantName}</h1>
        {data.settings?.description && (
          <p className="mt-2 text-muted-foreground">{data.settings.description}</p>
        )}
        {data.settings?.phone || data.settings?.whatsapp || data.settings?.address ? (
          <div className="mt-4 flex items-center justify-center gap-3 text-sm text-muted-foreground">
            {data.settings.phone && <span>📞 {data.settings.phone}</span>}
            {data.settings.whatsapp && (
              <a
                href={`https://wa.me/${data.settings.whatsapp.replace(/\D/g, "")}`}
                className="text-primary hover:underline"
              >
                WhatsApp
              </a>
            )}
            {data.settings.address && <span>📍 {data.settings.address}</span>}
          </div>
        ) : null}
      </header>

      {data.categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          <Link
            href={`/shop/${slug}`}
            className="px-4 py-2 rounded-full border text-sm font-medium hover:bg-accent"
          >
            Tümü
          </Link>
          {data.categories.map((c: any) => (
            <Link
              key={c.id}
              href={`/shop/${slug}?cat=${c.id}`}
              className="px-4 py-2 rounded-full border text-sm font-medium hover:bg-accent"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {data.products.length > 0 ? (
          data.products.map((p: any) => (
            <Card key={p.id} className="flex flex-col h-full group">
              <CardContent className="flex-1 flex flex-col p-4">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="h-32 w-full object-cover rounded-xl mb-3" />
                ) : (
                  <div className="h-32 w-full rounded-xl bg-secondary flex items-center justify-center text-muted-foreground text-sm mb-3">
                    Görsel yok
                  </div>
                )}
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground mb-2">
                  {p.category?.name || "Genel"} · {p.stock} adet
                </div>
                <div className="text-lg font-bold">{p.sellPrice.toLocaleString("tr-TR")} TL</div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {p.description || ""}
                </p>
              </CardContent>
              <CardContent className="p-4 pt-0">
                <Button
                  onClick={() => {
                    const phone = (data.settings?.whatsapp || "").replace(/\D/g, "") || "90";
                    const msg = encodeURIComponent(
                      `Merhaba, "${p.name}" ürününü sipariş vermek istiyorum. Fiyat: ${p.sellPrice.toLocaleString("tr-TR")} TL`
                    );
                    window.open(`https://wa.me/${phone}/?text=${msg}`, "_blank");
                  }}
                  className="w-full"
                >
                  WhatsApp'ta Sipariş Ver
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Henüz ürün yok.
          </div>
        )}
      </div>

      <OrderForm tenantId={data.tenantId} />
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { storeSettings: true },
  });
  if (!tenant) {
    return { title: "Mağaza bulunamadı" };
  }
  return {
    title: `${tenant.name} - Dijital Mağaza`,
    description: tenant.storeSettings?.description || `${tenant.name} ürün kataloğuna hoş geldiniz.`,
    openGraph: {
      title: tenant.name,
      description: tenant.storeSettings?.description,
      type: "website",
    },
  };
}
