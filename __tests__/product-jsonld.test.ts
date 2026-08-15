import { describe, expect, it } from "vitest";
import { buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/catalog/product-jsonld";
import type { ProductDetail } from "@/lib/data/types";

/*
  Yapılandırılmış veri testleri.

  ASIL KONU DOĞRULUK: yapılandırılmış veri arama motoruna verilen bir beyandır.
  Sayfada olmayan bir bilgiyi (fiyat, puan, yorum) oraya yazmak, bilgi dosyası
  §20'nin ihlalidir. Bu testler o ihlalin geri gelmesini engeller.
*/

const BASE: ProductDetail = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Ana Fırça Modülü",
  slug: "ana-firca-modulu",
  sku: "RF-101",
  shortDescription: "Robot süpürgeler için ana fırça modülü.",
  priceMinor: null,
  compareAtPriceMinor: null,
  currency: "TRY",
  availability: "in_stock",
  isFeatured: false,
  isDemo: false,
  brand: { id: "b1", name: "Roborock", slug: "roborock" },
  category: { id: "c1", name: "Fırçalar", slug: "fircalar" },
  primaryImage: null,
  longDescription: null,
  isOriginal: null,
  boxContents: null,
  installationNotes: null,
  seoTitle: null,
  seoDescription: null,
  images: [],
  specs: [],
  compatibleModels: [],
  marketplaceLinks: [],
};

const URL = "https://example.com/urunler/ana-firca-modulu";

describe("buildProductJsonLd", () => {
  it("fiyat yoksa offers bloğu HİÇ yazılmaz", () => {
    const jsonLd = buildProductJsonLd({ product: BASE, url: URL, imageUrls: [] });

    // Sayfada "Fiyat için iletişime geçin" yazarken burada satın alınabilir
    // bir teklif beyan etmek çelişki olurdu.
    expect(jsonLd).not.toHaveProperty("offers");
    expect(JSON.stringify(jsonLd)).not.toContain("price");
  });

  it("fiyat varsa offers'ı ana birime çevirerek yazar", () => {
    const jsonLd = buildProductJsonLd({
      product: { ...BASE, priceMinor: 124900 },
      url: URL,
      imageUrls: [],
    });

    expect(jsonLd.offers).toMatchObject({
      "@type": "Offer",
      priceCurrency: "TRY",
      price: "1249.00",
      availability: "https://schema.org/InStock",
    });
  });

  it("sıfır fiyatı teklif saymaz", () => {
    // price_minor = 0 "bedava" değil, girilmemiş demektir.
    const jsonLd = buildProductJsonLd({
      product: { ...BASE, priceMinor: 0 },
      url: URL,
      imageUrls: [],
    });
    expect(jsonLd).not.toHaveProperty("offers");
  });

  it("her bulunabilirlik durumunu schema.org karşılığına eşler", () => {
    const cases = [
      ["in_stock", "https://schema.org/InStock"],
      ["limited", "https://schema.org/LimitedAvailability"],
      ["on_order", "https://schema.org/BackOrder"],
      ["out_of_stock", "https://schema.org/OutOfStock"],
    ] as const;

    for (const [status, expected] of cases) {
      const jsonLd = buildProductJsonLd({
        product: { ...BASE, priceMinor: 1000, availability: status },
        url: URL,
        imageUrls: [],
      });
      expect((jsonLd.offers as { availability: string }).availability).toBe(expected);
    }
  });

  it("puan ve yorum alanlarını ASLA üretmez", () => {
    const serialized = JSON.stringify(
      buildProductJsonLd({ product: { ...BASE, priceMinor: 9900 }, url: URL, imageUrls: [] }),
    );

    expect(serialized).not.toContain("aggregateRating");
    expect(serialized).not.toContain("review");
    expect(serialized).not.toContain("ratingValue");
  });

  it("boş isteğe bağlı alanları atlar", () => {
    const jsonLd = buildProductJsonLd({
      product: { ...BASE, sku: null, brand: null, category: null, shortDescription: null },
      url: URL,
      imageUrls: [],
    });

    expect(jsonLd).not.toHaveProperty("sku");
    expect(jsonLd).not.toHaveProperty("brand");
    expect(jsonLd).not.toHaveProperty("category");
    expect(jsonLd).not.toHaveProperty("description");
    expect(jsonLd).not.toHaveProperty("image");
  });

  it("dolu alanları olduğu gibi taşır", () => {
    const jsonLd = buildProductJsonLd({
      product: {
        ...BASE,
        specs: [{ id: "s1", label: "Malzeme", value: "Silikon" }],
      },
      url: URL,
      imageUrls: ["https://example.com/a.jpg"],
    });

    expect(jsonLd).toMatchObject({
      "@type": "Product",
      name: "Ana Fırça Modülü",
      sku: "RF-101",
      brand: { "@type": "Brand", name: "Roborock" },
      category: "Fırçalar",
      image: ["https://example.com/a.jpg"],
    });
    expect(jsonLd.additionalProperty).toEqual([
      { "@type": "PropertyValue", name: "Malzeme", value: "Silikon" },
    ]);
  });

  it("seo açıklaması varsa kısa açıklamanın önüne geçer", () => {
    const jsonLd = buildProductJsonLd({
      product: { ...BASE, seoDescription: "SEO metni" },
      url: URL,
      imageUrls: [],
    });
    expect(jsonLd.description).toBe("SEO metni");
  });
});

describe("buildBreadcrumbJsonLd", () => {
  it("sırayı 1'den başlayarak numaralar", () => {
    const jsonLd = buildBreadcrumbJsonLd([
      { name: "Ana sayfa", url: "https://example.com" },
      { name: "Ürünler", url: "https://example.com/urunler" },
    ]);

    expect(jsonLd.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Ana sayfa", item: "https://example.com" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Ürünler",
        item: "https://example.com/urunler",
      },
    ]);
  });
});
