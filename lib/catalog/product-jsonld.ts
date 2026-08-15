import type { AvailabilityStatus, ProductDetail } from "@/lib/data/types";

/*
  Ürün yapılandırılmış verisi (schema.org/Product).

  DOĞRULUK KURALI (bilgi dosyası §18, §20 + CLAUDE.md):
  Yapılandırılmış veri, sayfada GERÇEKTEN bulunan bilgiyi yansıtır. Burada
  hiçbir alan tahmin edilmez, doldurulmaz veya "makul varsayılan"a çekilmez:

  - Fiyat yoksa `offers` bloğu HİÇ YAZILMAZ. Fiyatsız bir Offer üretip
    availability'yi oraya sıkıştırmak, arama motoruna satın alınabilir bir
    teklif olduğunu söylerdi — sayfada ise "Fiyat için iletişime geçin" yazar.
    İkisi çelişemez.
  - `aggregateRating` / `review` ASLA üretilmez: doğrulanmış müşteri yorumu
    verimiz yok (§20).
  - `sku`, `brand`, `description`, `image` yalnız gerçekten varsa eklenir.

  Saf fonksiyondur — React, env veya ağ bilmez; doğrudan test edilir.
*/

/** Şemadaki durum → schema.org ItemAvailability. Eşleme birebirdir, yorum katılmaz. */
const AVAILABILITY_URL: Record<AvailabilityStatus, string> = {
  in_stock: "https://schema.org/InStock",
  limited: "https://schema.org/LimitedAvailability",
  // "Siparişle temin edilir" = sipariş alınır, stoktan çıkmaz → BackOrder.
  on_order: "https://schema.org/BackOrder",
  out_of_stock: "https://schema.org/OutOfStock",
};

export interface ProductJsonLdInput {
  product: ProductDetail;
  /** Ürünün mutlak URL'i. */
  url: string;
  /** Mutlak görsel URL'leri; boş olabilir. */
  imageUrls: string[];
}

/** `JSON.stringify` edilip `<script type="application/ld+json">` içine konur. */
export function buildProductJsonLd({ product, url, imageUrls }: ProductJsonLdInput) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url,
  };

  const description = product.seoDescription ?? product.shortDescription;
  if (description) jsonLd.description = description;

  if (imageUrls.length > 0) jsonLd.image = imageUrls;
  if (product.sku) jsonLd.sku = product.sku;
  if (product.brand) jsonLd.brand = { "@type": "Brand", name: product.brand.name };
  if (product.category) jsonLd.category = product.category.name;

  if (product.specs.length > 0) {
    jsonLd.additionalProperty = product.specs.map((spec) => ({
      "@type": "PropertyValue",
      name: spec.label,
      value: spec.value,
    }));
  }

  /*
    Offer YALNIZ gerçek bir fiyat varsa. `priceMinor` kuruştur; şemada
    `price` ana birimdir.
  */
  if (typeof product.priceMinor === "number" && product.priceMinor > 0) {
    jsonLd.offers = {
      "@type": "Offer",
      url,
      priceCurrency: product.currency,
      price: (product.priceMinor / 100).toFixed(2),
      availability: AVAILABILITY_URL[product.availability],
    };
  }

  return jsonLd;
}

export interface BreadcrumbItem {
  name: string;
  /** Mutlak URL. */
  url: string;
}

/** Kırıntı navigasyonunun yapılandırılmış karşılığı — ekrandakiyle aynı sırada. */
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
