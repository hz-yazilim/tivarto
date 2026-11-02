import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma, withTenant } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import StorefrontOrder from "@/components/storefront-order";
import DemoBanner from "@/components/demo-banner";
import DemoRoleSwitcher from "@/components/demo-role-switcher";

export const dynamic = "force-dynamic";

async function fetchStorefrontData(slug: string, categoryId?: string) {
  // Vitrin herkese açık: tenant slug ile bulunur.
  // DİKKAT: `Tenant` RLS korumasız olduğu için doğrudan okunabilir; ancak
  // `StoreSettings` ve `Category` RLS korumalıdır — bu yüzden tenant bağlamı
  // kurulmadan okunurlarsa boş dönerler (fail-closed).
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) return null;

  return withTenant(tenant.id, async (tx) => {
    const storeSettings = await tx.storeSettings.findUnique({
      where: { tenantId: tenant.id },
    });

    const categories = await tx.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    });

    const products = await tx.product.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true,
        ...(categoryId ? { categoryId } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        sellPrice: true,
        stock: true,
        category: { select: { name: true } },
      },
    });

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      status: tenant.status,
      settings: storeSettings,
      categories,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        imageUrl: p.imageUrl,
        sellPrice: Number(p.sellPrice),
        stock: p.stock,
        categoryName: p.category?.name ?? "Genel",
      })),
    };
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) return { title: "Mağaza bulunamadı" };

  const description = await withTenant(tenant.id, async (tx) => {
    const settings = await tx.storeSettings.findUnique({
      where: { tenantId: tenant.id },
      select: { description: true },
    });
    return settings?.description ?? null;
  });

  return {
    title: `${tenant.name} — Online Mağaza`,
    description:
      description ?? `${tenant.name} ürün kataloğuna hoş geldiniz.`,
    openGraph: {
      title: tenant.name,
      description: description ?? undefined,
      type: "website",
    },
  };
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cat?: string }>;
}) {
  const { slug } = await params;
  const { cat } = await searchParams;

  const data = await fetchStorefrontData(slug, cat);
  if (!data) notFound();

  const whatsapp = (data.settings?.whatsapp ?? "").replace(/\D/g, "");

  return (
    <div className="min-h-screen bg-secondary">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
        <nav className="mb-6 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm">
              ← Tivarto
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/musteri"
              className="text-xs font-medium text-primary hover:underline"
            >
              Siparişlerim
            </Link>
            <span className="text-xs text-muted-foreground">
              {slug} · Tivarto vitrini
            </span>
          </div>
        </nav>

        <div className="mb-4">
          <DemoRoleSwitcher compact />
        </div>

        <DemoBanner />

        {data.status !== "ACTIVE" && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Bu mağaza geçici olarak hizmete kapalıdır.
          </div>
        )}

        <header className="mb-8 rounded-2xl border border-border bg-card p-6 text-center">
          {data.settings?.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.settings.coverUrl}
              alt="Mağaza kapak görseli"
              className="mb-4 h-32 w-full rounded-xl object-cover"
            />
          )}
          {data.settings?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.settings.logoUrl}
              alt={`${data.tenantName} logosu`}
              className="mx-auto mb-3 h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
              {data.tenantName.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-2xl font-bold md:text-3xl">{data.tenantName}</h1>
          {data.settings?.description && (
            <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
              {data.settings.description}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            {data.settings?.phone && <span>📞 {data.settings.phone}</span>}
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                WhatsApp ile yaz
              </a>
            )}
            {data.settings?.address && <span>📍 {data.settings.address}</span>}
            {data.settings?.mapsUrl && (
              <a
                href={data.settings.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Haritada gör
              </a>
            )}
          </div>
        </header>

        {data.categories.length > 0 && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            <Link
              href={`/shop/${slug}`}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium ${
                !cat ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"
              }`}
            >
              Tümü
            </Link>
            {data.categories.map((c) => (
              <Link
                key={c.id}
                href={`/shop/${slug}?cat=${c.id}`}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium ${
                  cat === c.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card hover:bg-accent"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.products.length > 0 ? (
            data.products.map((p) => (
              <Card key={p.id} className="flex h-full flex-col">
                <CardContent className="flex flex-1 flex-col p-4">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="mb-3 h-36 w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="mb-3 flex h-36 w-full items-center justify-center rounded-xl bg-secondary text-sm text-muted-foreground">
                      Görsel yok
                    </div>
                  )}
                  <div className="font-medium">{p.name}</div>
                  <div className="mb-1 text-xs text-muted-foreground">
                    {p.categoryName} ·{" "}
                    {p.stock > 0 ? `${p.stock} adet` : "Stokta yok"}
                  </div>
                  {p.description && (
                    <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
                      {p.description}
                    </p>
                  )}
                  <div className="mt-auto text-lg font-bold">
                    {p.sellPrice.toLocaleString("tr-TR")} TL
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full rounded-xl border border-border bg-card py-12 text-center text-muted-foreground">
              Bu kategoride henüz ürün yok.
            </div>
          )}
        </div>

        <StorefrontOrder
          tenantId={data.tenantId}
          tenantName={data.tenantName}
          whatsappNumber={whatsapp}
          products={data.products.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.sellPrice,
            stock: p.stock,
          }))}
          disabled={data.status !== "ACTIVE"}
        />
      </div>
    </div>
  );
}
