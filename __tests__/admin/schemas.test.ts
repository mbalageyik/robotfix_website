import { describe, expect, it } from "vitest";
import {
  brandSchema,
  deviceModelSchema,
  marketplaceLinkSchema,
  productSchema,
  siteSettingsSchema,
  slugSchema,
} from "@/lib/admin/schemas";

/*
  Sunucu doğrulama şemaları.

  Bu şemalar TEK geçerli kapıdır: aksiyon uç noktasına arayüzden geçmeden
  istek gönderilebilir, dolayısıyla formdaki `required` ve `maxlength`
  öznitelikleri güvenlik sayılmaz. Buradaki testler o kapının gerçekten
  kapandığını doğrular.
*/

/** Şemayı geçen en küçük geçerli ürün. Testler bunun üzerine fark uygular. */
const VALID_PRODUCT = {
  name: "Fırça modülü",
  slug: "",
  brandId: "",
  categoryId: "",
  sku: "",
  shortDescription: "",
  longDescription: "",
  priceMinor: "",
  compareAtPriceMinor: "",
  availability: "in_stock",
  isOriginal: "unknown",
  boxContents: "",
  installationNotes: "",
  isFeatured: false,
  displayOrder: "0",
  status: "draft",
  seoTitle: "",
  seoDescription: "",
} as const;

function parseProduct(overrides: Partial<Record<string, unknown>> = {}) {
  return productSchema.safeParse({ ...VALID_PRODUCT, ...overrides });
}

describe("ürün şeması — temel", () => {
  it("en küçük geçerli ürünü kabul eder", () => {
    expect(parseProduct().success).toBe(true);
  });

  it("ad zorunludur", () => {
    expect(parseProduct({ name: "" }).success).toBe(false);
    expect(parseProduct({ name: "   " }).success).toBe(false);
  });

  it("boş slug null'a çevrilir (sunucu üretecek)", () => {
    const result = parseProduct();
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.slug).toBeNull();
  });

  it("elle girilen slug biçimi denetlenir", () => {
    expect(parseProduct({ slug: "gecerli-slug-2" }).success).toBe(true);
    expect(parseProduct({ slug: "Büyük Harf" }).success).toBe(false);
    expect(parseProduct({ slug: "-bastan-tire" }).success).toBe(false);
    expect(parseProduct({ slug: "sondan-tire-" }).success).toBe(false);
  });

  it("geçersiz bulunabilirlik değeri reddedilir", () => {
    expect(parseProduct({ availability: "belki_vardir" }).success).toBe(false);
  });

  it("geçersiz yayın durumu reddedilir", () => {
    expect(parseProduct({ status: "yayinda_sanki" }).success).toBe(false);
  });
});

describe("ürün şeması — fiyat kuralları (bilgi dosyası §6)", () => {
  it("boş fiyat null olur", () => {
    const result = parseProduct({ priceMinor: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.priceMinor).toBeNull();
  });

  it("sıfır fiyat reddedilir", () => {
    expect(parseProduct({ priceMinor: "0" }).success).toBe(false);
  });

  it("fiyat kuruşa çevrilir", () => {
    const result = parseProduct({ priceMinor: "1249,90" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.priceMinor).toBe(124_990);
  });

  it("güncel fiyat olmadan eski fiyat girilemez", () => {
    // Yanıltıcı indirim gösterimi engellenir.
    const result = parseProduct({ priceMinor: "", compareAtPriceMinor: "999" });
    expect(result.success).toBe(false);
  });

  it("eski fiyat güncel fiyattan büyük olmalıdır", () => {
    expect(
      parseProduct({ priceMinor: "1000", compareAtPriceMinor: "500" }).success,
    ).toBe(false);
    expect(parseProduct({ priceMinor: "1000", compareAtPriceMinor: "500" }).success).toBe(false);
  });

  it("gerçek indirim kabul edilir", () => {
    expect(parseProduct({ priceMinor: "500", compareAtPriceMinor: "1000" }).success).toBe(true);
  });

  it("eşit fiyatlar indirim sayılmaz", () => {
    expect(parseProduct({ priceMinor: "1000", compareAtPriceMinor: "1000" }).success).toBe(false);
  });
});

describe("ürün şeması — orijinal/uyumlu üç durumu (§20)", () => {
  it("'unknown' null'a çevrilir — doğrulanmamış demektir", () => {
    const result = parseProduct({ isOriginal: "unknown" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isOriginal).toBeNull();
  });

  it("'original' true olur", () => {
    const result = parseProduct({ isOriginal: "original" });
    if (result.success) expect(result.data.isOriginal).toBe(true);
  });

  it("'compatible' false olur — null ile KARIŞTIRILMAZ", () => {
    const result = parseProduct({ isOriginal: "compatible" });
    if (result.success) expect(result.data.isOriginal).toBe(false);
  });
});

describe("pazaryeri bağlantısı", () => {
  const VALID_LINK = {
    marketplace: "trendyol",
    customLabel: "",
    url: "https://www.trendyol.com/urun",
    linkTarget: "product",
    isActive: true,
  };

  it("geçerli bağlantıyı kabul eder", () => {
    expect(marketplaceLinkSchema.safeParse(VALID_LINK).success).toBe(true);
  });

  it("http:// reddedilir", () => {
    expect(
      marketplaceLinkSchema.safeParse({ ...VALID_LINK, url: "http://ornek.com" }).success,
    ).toBe(false);
  });

  it("'other' seçildiğinde görünen ad zorunludur", () => {
    expect(
      marketplaceLinkSchema.safeParse({ ...VALID_LINK, marketplace: "other", customLabel: "" })
        .success,
    ).toBe(false);

    expect(
      marketplaceLinkSchema.safeParse({
        ...VALID_LINK,
        marketplace: "other",
        customLabel: "Kendi mağazamız",
      }).success,
    ).toBe(true);
  });

  it("bilinmeyen pazaryeri reddedilir", () => {
    expect(
      marketplaceLinkSchema.safeParse({ ...VALID_LINK, marketplace: "gittigidiyor" }).success,
    ).toBe(false);
  });
});

describe("site ayarları şeması", () => {
  const EMPTY = {
    whatsapp_phone: "",
    phone_display: "",
    address_line: "",
    working_hours: "",
    maps_url: "",
    store_amazon_url: "",
    store_hepsiburada_url: "",
    store_trendyol_url: "",
    store_pazarama_url: "",
    whatsapp_template_product: "",
    whatsapp_template_service: "",
  };

  it("tamamen boş form geçerlidir", () => {
    // Doğrulanmamış bilgiyi boş bırakmak MEŞRUDUR (§20).
    const result = siteSettingsSchema.safeParse(EMPTY);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.whatsapp_phone).toBeNull();
  });

  it("mağaza bağlantısı https zorunlu", () => {
    expect(
      siteSettingsSchema.safeParse({ ...EMPTY, store_trendyol_url: "http://trendyol.com" })
        .success,
    ).toBe(false);

    expect(
      siteSettingsSchema.safeParse({ ...EMPTY, store_trendyol_url: "https://trendyol.com" })
        .success,
    ).toBe(true);
  });

  it("bozuk adres reddedilir", () => {
    expect(
      siteSettingsSchema.safeParse({ ...EMPTY, maps_url: "https://" }).success,
    ).toBe(false);
  });

  it("boş bağlantı alanı null olur (buton hiç gösterilmez)", () => {
    const result = siteSettingsSchema.safeParse(EMPTY);
    if (result.success) {
      expect(result.data.store_amazon_url).toBeNull();
      expect(result.data.maps_url).toBeNull();
    }
  });
});

describe("taksonomi şemaları", () => {
  it("markada ad zorunlu", () => {
    const base = { name: "", slug: "", description: "", displayOrder: "0", status: "draft" };
    expect(brandSchema.safeParse(base).success).toBe(false);
    expect(brandSchema.safeParse({ ...base, name: "Roborock" }).success).toBe(true);
  });

  /*
    zod v4 `.uuid()` RFC'ye SIKI uyar: sürüm nibble'ı 1-8, varyant nibble'ı
    8/9/a/b olmalıdır. Postgres'in `gen_random_uuid()` fonksiyonu v4 üretir ve
    bu kurala uyar — aşağıdaki değer gerçek bir tohum satırının biçimindedir.
  */
  const REAL_SHAPED_UUID = "97681577-7370-447e-bcc9-468c025039a9";

  it("cihaz modelinde marka zorunlu", () => {
    const base = { name: "S8", slug: "", brandId: "", notes: "", status: "draft" };
    expect(deviceModelSchema.safeParse(base).success).toBe(false);

    expect(deviceModelSchema.safeParse({ ...base, brandId: REAL_SHAPED_UUID }).success).toBe(
      true,
    );
  });

  it("veritabanının ürettiği biçimdeki UUID kabul edilir", () => {
    // Şema gerçek verimizi reddediyorsa panel hiçbir marka seçtiremezdi.
    const result = productSchema.safeParse({ ...VALID_PRODUCT, brandId: REAL_SHAPED_UUID });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.brandId).toBe(REAL_SHAPED_UUID);
  });

  it("marka kimliği UUID olmalı", () => {
    expect(
      deviceModelSchema.safeParse({
        name: "S8",
        slug: "",
        brandId: "bu-bir-uuid-degil",
        notes: "",
        status: "draft",
      }).success,
    ).toBe(false);
  });
});

describe("slug şeması", () => {
  it("geçerli slug'ları kabul eder", () => {
    for (const value of ["a", "urun", "urun-2", "cok-parcali-slug-123"]) {
      expect(slugSchema.safeParse(value).success, value).toBe(true);
    }
  });

  it("geçersiz slug'ları reddeder", () => {
    for (const value of ["", "Büyük", "boşluk var", "-onde", "arkada-", "cift--tire", "türkçe"]) {
      expect(slugSchema.safeParse(value).success, value).toBe(false);
    }
  });
});
