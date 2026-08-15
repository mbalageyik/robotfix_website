import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { ProductCard } from "@/components/catalog/ProductCard";
import { ProductGallery, type GalleryImage } from "@/components/catalog/ProductGallery";
import { AvailabilityBadge } from "@/components/ui/AvailabilityBadge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/layout/Container";
import { Price, formatPriceOrNull } from "@/components/ui/Price";
import { Section } from "@/components/layout/Section";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { buildCatalogHref } from "@/lib/catalog/query-params";
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/catalog/product-jsonld";
import { getProductBySlug, getRelatedProducts } from "@/lib/data/products";
import { productImageUrl } from "@/lib/images";
import { siteUrl, whatsappCtaLabels } from "@/lib/site-config";
import type { Marketplace, ProductDetail } from "@/lib/data/types";

/*
  ÜRÜN DETAY SAYFASI (bilgi dosyası §7).

  GÖRÜNÜRLÜK: `getProductBySlug` status filtresi yazmaz — taslak bir ürünün
  slug'ı doğrudan adres çubuğuna yazılsa bile RLS satırı döndürmez ve sayfa
  404 verir. "Gizli önizleme bağlantısı" diye bir kaçamak YOKTUR.

  DOĞRULUK: doğrulanmamış hiçbir alan uydurulmaz. `is_original` null ise
  orijinal/uyumlu rozeti HİÇ gösterilmez; uyumluluk notu yoksa liste
  "doğrulanmadı" ibaresiyle sunulur (§20).
*/

export const revalidate = 300;

/** Pazaryeri enum'u → görünen ad. `other` yöneticinin yazdığı adı kullanır. */
const MARKETPLACE_LABELS: Record<Marketplace, string> = {
  amazon: "Amazon",
  hepsiburada: "Hepsiburada",
  trendyol: "Trendyol",
  pazarama: "Pazarama",
  other: "Pazaryeri",
};

function productUrl(slug: string): string {
  return `${siteUrl}/urunler/${slug}`;
}

/** Sayfada gösterilen fiyat metni — WhatsApp mesajı da AYNI metni kullanır. */
function displayPrice(product: ProductDetail): string | null {
  return formatPriceOrNull(
    product.priceMinor === null ? null : product.priceMinor / 100,
    product.currency,
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/urunler/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProductBySlug(slug);

  if (!result.ok) {
    // Bulunamayan ürün için indekslenecek bir başlık üretmeyiz.
    return { title: "Ürün bulunamadı", robots: { index: false, follow: true } };
  }

  const product = result.data;
  const title = product.seoTitle?.trim() || product.name;
  const description =
    product.seoDescription?.trim() ||
    product.shortDescription?.trim() ||
    `${product.name} — Robot Fix yedek parça ve aksesuar kataloğu.`;

  const primary = product.images.find((image) => image.isPrimary) ?? product.images[0];
  const imageUrl = primary ? productImageUrl(primary.storagePath) : null;

  return {
    title,
    description,
    alternates: { canonical: productUrl(product.slug) },
    openGraph: {
      title,
      description,
      type: "website",
      url: productUrl(product.slug),
      ...(imageUrl ? { images: [{ url: imageUrl, alt: primary?.altText || product.name }] } : {}),
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps<"/urunler/[slug]">) {
  const { slug } = await params;
  const result = await getProductBySlug(slug);

  /*
    `not_found` → 404. Diğer hatalar (ör. veritabanı erişilemiyor) da 404'e
    düşürülür ÇÜNKÜ sayfanın gösterecek içeriği yoktur; ancak sebebi sunucu
    günlüğüne yazılır, sessizce kaybolmaz.
  */
  if (!result.ok) {
    if (result.error.kind !== "not_found") {
      console.error(`[urun-detay] ${slug} okunamadı: ${result.error.message}`);
    }
    notFound();
  }

  const product = result.data;
  const related = await getRelatedProducts(product.id, product.category?.slug ?? null);
  const relatedItems = related.ok ? related.data : [];

  const galleryImages: GalleryImage[] = product.images.flatMap((image) => {
    const url = productImageUrl(image.storagePath);
    return url ? [{ id: image.id, url, altText: image.altText }] : [];
  });

  const priceText = displayPrice(product);
  const url = productUrl(product.slug);

  const jsonLd = buildProductJsonLd({
    product,
    url,
    imageUrls: galleryImages.map((image) => image.url),
  });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Ana sayfa", url: siteUrl },
    { name: "Ürünler", url: `${siteUrl}/urunler` },
    { name: product.name, url },
  ]);

  return (
    <main className="flex-1">
      {/* Yapılandırılmış veri yalnız yukarıdaki gerçek alanlardan üretilir. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Container width="wide" className="pt-6">
        <Breadcrumbs
          items={[
            { label: "Ana sayfa", href: "/" },
            { label: "Ürünler", href: "/urunler" },
            ...(product.category
              ? [
                  {
                    label: product.category.name,
                    href: buildCatalogHref({ categorySlug: product.category.slug }),
                  },
                ]
              : []),
            { label: product.name },
          ]}
        />
      </Container>

      <Container width="wide" className="grid gap-8 py-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={galleryImages} fallbackAlt={product.name} />

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-caption text-text-muted">
              {product.brand ? (
                <a
                  href={buildCatalogHref({ brandSlug: product.brand.slug })}
                  className="font-semibold text-link hover:text-link-hover hover:underline"
                >
                  {product.brand.name}
                </a>
              ) : (
                "Marka belirtilmedi"
              )}
              {product.category && (
                <>
                  <span aria-hidden="true"> · </span>
                  {product.category.name}
                </>
              )}
            </p>

            <h1 className="text-h1">{product.name}</h1>

            {product.sku && (
              <p className="font-mono text-caption text-text-muted">
                <span className="sr-only">Ürün kodu: </span>
                {product.sku}
              </p>
            )}
          </div>

          {product.shortDescription && (
            <p className="max-w-prose text-body-lg text-text-muted">{product.shortDescription}</p>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <Price
              amount={product.priceMinor === null ? null : product.priceMinor / 100}
              compareAtAmount={
                product.compareAtPriceMinor === null ? null : product.compareAtPriceMinor / 100
              }
              currency={product.currency}
              size="lg"
            />
            <AvailabilityBadge status={product.availability} />
          </div>

          {/*
            `is_original` NULL ise hiçbir rozet gösterilmez: "orijinal mi
            uyumlu mu" doğrulanmamış bir bilgidir ve tahmin edilmez (§20).
          */}
          {product.isOriginal !== null && (
            <p className="text-caption text-text-muted">
              {product.isOriginal
                ? "Orijinal (üretici) parça"
                : "Uyumlu (muadil) parça — orijinal üretici ürünü değildir"}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <WhatsAppButton
              intent="product"
              label={whatsappCtaLabels.productInfo}
              size="lg"
              fullWidth
              event="whatsapp_product_click"
              product={{
                productName: product.name,
                brand: product.brand?.name ?? null,
                sku: product.sku,
                // Sayfada görünen fiyatın AYNISI; fiyat yoksa satır hiç yazılmaz.
                price: priceText,
                url,
              }}
            />

            {/*
              Bilgi dosyası §9: bağlantısı olmayan pazaryerinin butonu HİÇ
              gösterilmez. Pasif bağlantılar veri katmanında zaten elenir.
            */}
            {product.marketplaceLinks.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-caption font-semibold text-text">Pazaryerinde görüntüle</p>
                <div className="flex flex-wrap gap-2">
                  {product.marketplaceLinks.map((link) => (
                    <ButtonLink
                      key={link.id}
                      href={link.url}
                      variant="marketplace"
                      external
                      data-event="marketplace_click"
                    >
                      {link.customLabel?.trim() || MARKETPLACE_LABELS[link.marketplace]}
                      <span className="sr-only">
                        {link.linkTarget === "store" ? " (mağaza sayfası)" : " (ürün sayfası)"}
                      </span>
                    </ButtonLink>
                  ))}
                </div>
              </div>
            )}
          </div>

          {product.specs.length > 0 && (
            <Card padding="sm">
              <h2 className="text-h4">Teknik özellikler</h2>
              <dl className="mt-3 flex flex-col">
                {product.specs.map((spec) => (
                  <div
                    key={spec.id}
                    className="flex flex-wrap gap-x-3 border-b border-border py-2 last:border-b-0"
                  >
                    <dt className="min-w-40 text-caption font-semibold text-text">{spec.label}</dt>
                    <dd className="text-caption text-text-muted">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}
        </div>
      </Container>

      {(product.longDescription || product.boxContents || product.installationNotes) && (
        <Section surface="raised" spacing="tight" width="wide" labelledBy="urun-aciklama-basligi">
          <h2 id="urun-aciklama-basligi" className="text-h3">
            Ürün açıklaması
          </h2>
          <div className="mt-4 grid gap-6 lg:grid-cols-3">
            {product.longDescription && (
              <div className="lg:col-span-2">
                {/* `whitespace-pre-line`: panelde girilen satır sonları korunur. */}
                <p className="max-w-prose whitespace-pre-line text-body text-text-muted">
                  {product.longDescription}
                </p>
              </div>
            )}
            <div className="flex flex-col gap-5">
              {product.boxContents && (
                <div>
                  <h3 className="text-h4">Kutu içeriği</h3>
                  <p className="mt-2 whitespace-pre-line text-body text-text-muted">
                    {product.boxContents}
                  </p>
                </div>
              )}
              {product.installationNotes && (
                <div>
                  <h3 className="text-h4">Kullanım ve montaj notları</h3>
                  <p className="mt-2 whitespace-pre-line text-body text-text-muted">
                    {product.installationNotes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Section>
      )}

      {product.compatibleModels.length > 0 && (
        <Section spacing="tight" width="wide" labelledBy="uyumluluk-basligi">
          <h2 id="uyumluluk-basligi" className="text-h3">
            Uyumlu cihaz modelleri
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {product.compatibleModels.map((model) => (
              <li
                key={model.id}
                className="rounded-md border border-border bg-surface-raised px-3 py-2 text-caption text-text"
              >
                {model.brandName} {model.name}
                {/*
                  Doğrulanmamış uyumluluk SESSİZCE geçilmez: müşteri yanlış
                  parça almasın diye açıkça yazılır (§20).
                */}
                {model.verifiedNote === null && (
                  <span className="ml-1 text-text-muted">· uyumluluk doğrulanmadı</span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-prose text-caption text-text-muted">
            Cihazınızla uyumluluğundan emin değilseniz sipariş öncesi bize yazın; model ve parça
            numarasıyla birlikte kontrol edelim.
          </p>
        </Section>
      )}

      {relatedItems.length > 0 && (
        <Section surface="raised" spacing="tight" width="wide" labelledBy="ilgili-basligi">
          <h2 id="ilgili-basligi" className="text-h3">
            İlgili ürünler
          </h2>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {relatedItems.map((item) => (
              <li key={item.id} className="flex">
                <ProductCard product={item} />
              </li>
            ))}
          </ul>
        </Section>
      )}
    </main>
  );
}
