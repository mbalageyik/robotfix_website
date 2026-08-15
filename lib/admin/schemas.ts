import { z } from "zod";
import { parseMoneyToMinor } from "@/lib/admin/money";
import { HOME_SECTION_CONTENT_STATUSES } from "@/lib/home/section-registry";

/*
  SUNUCU TARAFI doğrulama şemaları.

  İstemci doğrulaması (required, type=email vb.) yalnız UX içindir; tek geçerli
  kapı burasıdır. Aksiyon uç noktasına arayüzden geçmeden istek gönderilebilir
  (Next.js dokümanı, Server Actions "Authenticate and authorize").

  Şemadaki kısıtların BİR KISMI burada tekrarlanır (uzunluk sınırları gibi).
  Bu bilinçli bir tekrardır: veritabanı kısıtı ihlal edildiğinde kullanıcıya
  anlaşılır bir mesaj değil, ham Postgres hatası dönerdi.
*/

// --- Ortak yardımcılar ----------------------------------------------------

/** Boş dizeyi `null`'a çevirir — form alanları hiç boş dize göndermemeli. */
const emptyToNull = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} en fazla ${max} karakter olabilir.`)
    .transform((value) => (value === "" ? null : value))
    .nullable();

const requiredText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} zorunludur.`)
    .max(max, `${label} en fazla ${max} karakter olabilir.`);

/** Şemadaki `slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'` kısıtının aynası. */
export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug zorunludur.")
  .max(200, "Slug çok uzun.")
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Slug yalnız küçük harf, rakam ve tire içerebilir; tireyle başlayamaz veya bitemez.",
  );

/** UUID veya boş (ilişki seçilmemiş). */
const optionalUuid = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .refine(
    (value) => value === null || z.string().uuid().safeParse(value).success,
    "Geçersiz seçim.",
  );

export const publicationStatusSchema = z.enum(["draft", "active", "passive", "archived"], {
  message: "Geçersiz yayın durumu.",
});

export const availabilitySchema = z.enum(["in_stock", "limited", "on_order", "out_of_stock"], {
  message: "Geçersiz bulunabilirlik durumu.",
});

export const marketplaceSchema = z.enum(
  ["amazon", "hepsiburada", "trendyol", "pazarama", "other"],
  { message: "Geçersiz pazaryeri." },
);

/** Şema `url ~* '^https://'` istiyor; http:// bilinçli olarak reddedilir. */
export const httpsUrlSchema = z
  .string()
  .trim()
  .min(1, "Bağlantı zorunludur.")
  .max(2000, "Bağlantı çok uzun.")
  .refine((value) => /^https:\/\//i.test(value), "Bağlantı https:// ile başlamalıdır.")
  .refine((value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }, "Bağlantı geçerli bir adres değil.");

/**
 * Fiyat alanı — boş bırakılabilir, sıfır bırakılamaz.
 * Gerekçe ve ayrıştırma: lib/admin/money.ts
 */
const priceField = z
  .string()
  .nullish()
  .transform((value, ctx) => {
    const result = parseMoneyToMinor(value);
    if (!result.ok) {
      ctx.addIssue({ code: "custom", message: result.message });
      return z.NEVER;
    }
    return result.minor;
  });

// --- Alt kayıtlar (formdan JSON olarak gelir) -----------------------------

export const specSchema = z.object({
  label: requiredText(120, "Özellik adı"),
  value: requiredText(500, "Özellik değeri"),
});

export const marketplaceLinkSchema = z
  .object({
    marketplace: marketplaceSchema,
    customLabel: emptyToNull(60, "Görünen ad"),
    url: httpsUrlSchema,
    linkTarget: z.enum(["product", "store"], { message: "Bağlantı hedefi seçilmeli." }),
    isActive: z.boolean(),
  })
  // Şemadaki `product_marketplace_links_other_needs_label` kısıtının aynası.
  .refine((link) => link.marketplace !== "other" || link.customLabel !== null, {
    message: '"Diğer" seçildiğinde görünen ad zorunludur.',
    path: ["customLabel"],
  });

export const productSubResourcesSchema = z.object({
  specs: z.array(specSchema).max(100, "En fazla 100 teknik özellik eklenebilir."),
  compatibleModelIds: z.array(z.string().uuid()).max(500),
  marketplaceLinks: z
    .array(marketplaceLinkSchema)
    .max(5, "Her pazaryeri için en fazla bir bağlantı eklenebilir."),
  relatedProductIds: z.array(z.string().uuid()).max(20),
});

// --- Ürün -----------------------------------------------------------------

export const productSchema = z
  .object({
    name: requiredText(200, "Ürün adı"),
    /** Boş bırakılırsa addan üretilir (veritabanının slugify() fonksiyonuyla). */
    slug: z
      .string()
      .trim()
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    brandId: optionalUuid,
    categoryId: optionalUuid,
    sku: emptyToNull(64, "Ürün kodu"),
    shortDescription: emptyToNull(400, "Kısa açıklama"),
    longDescription: emptyToNull(20000, "Uzun açıklama"),
    priceMinor: priceField,
    compareAtPriceMinor: priceField,
    availability: availabilitySchema,
    /** `null` = orijinal/uyumlu bilgisi DOĞRULANMADI (bilgi dosyası §20). */
    isOriginal: z
      .enum(["unknown", "original", "compatible"])
      .transform((value) => (value === "unknown" ? null : value === "original")),
    boxContents: emptyToNull(2000, "Kutu içeriği"),
    installationNotes: emptyToNull(4000, "Montaj notları"),
    isFeatured: z.boolean(),
    displayOrder: z.coerce
      .number()
      .int("Sıra tam sayı olmalıdır.")
      .min(0, "Sıra negatif olamaz.")
      .max(1_000_000, "Sıra çok büyük."),
    status: publicationStatusSchema,
    seoTitle: emptyToNull(70, "SEO başlığı"),
    seoDescription: emptyToNull(200, "SEO açıklaması"),
  })
  // Şemadaki `products_compare_at_requires_price` kısıtının aynası: yanıltıcı
  // indirim gösterimi engellenir (bilgi dosyası §6).
  .refine((product) => product.compareAtPriceMinor === null || product.priceMinor !== null, {
    message: "Eski fiyat girmek için güncel fiyat da girilmelidir.",
    path: ["compareAtPriceMinor"],
  })
  .refine(
    (product) =>
      product.compareAtPriceMinor === null ||
      product.priceMinor === null ||
      product.compareAtPriceMinor > product.priceMinor,
    {
      message: "Eski fiyat, güncel fiyattan büyük olmalıdır.",
      path: ["compareAtPriceMinor"],
    },
  )
  .refine((product) => product.slug === null || slugSchema.safeParse(product.slug).success, {
    message: "Slug yalnız küçük harf, rakam ve tire içerebilir; tireyle başlayamaz veya bitemez.",
    path: ["slug"],
  });

export type ProductInput = z.infer<typeof productSchema>;

// --- Taksonomi ------------------------------------------------------------

const baseTaxonomy = {
  name: requiredText(120, "Ad"),
  slug: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .refine((value) => value === null || slugSchema.safeParse(value).success, {
      message: "Slug yalnız küçük harf, rakam ve tire içerebilir.",
    }),
  displayOrder: z.coerce.number().int().min(0).max(1_000_000),
  status: publicationStatusSchema,
};

export const brandSchema = z.object({
  ...baseTaxonomy,
  description: emptyToNull(2000, "Açıklama"),
});

export const categorySchema = z.object({
  ...baseTaxonomy,
  description: emptyToNull(2000, "Açıklama"),
  parentId: optionalUuid,
});

export const deviceModelSchema = z.object({
  name: requiredText(120, "Model adı"),
  slug: baseTaxonomy.slug,
  brandId: z.string().uuid("Marka seçilmelidir."),
  notes: emptyToNull(1000, "Notlar"),
  status: publicationStatusSchema,
});

export const serviceSchema = z.object({
  name: requiredText(160, "Hizmet adı"),
  slug: baseTaxonomy.slug,
  shortDescription: emptyToNull(400, "Kısa açıklama"),
  longDescription: emptyToNull(20000, "Uzun açıklama"),
  iconKey: emptyToNull(60, "Simge anahtarı"),
  displayOrder: baseTaxonomy.displayOrder,
  status: publicationStatusSchema,
  seoTitle: emptyToNull(70, "SEO başlığı"),
  seoDescription: emptyToNull(200, "SEO açıklaması"),
});

// --- Site ayarları --------------------------------------------------------

/*
  WhatsApp numarası E.164'e ÇEVRİLİR, burada yeniden yazılmaz:
  `lib/whatsapp.ts` → `normalizePhone()` tek kaynaktır (gereksinim 5.5).
  Şema yalnız "boş bırakılabilir" kuralını ekler; dönüşüm aksiyonda yapılır.
*/

/**
 * Boş bırakılabilen bağlantı alanı. Doluysa `https://` ZORUNLUDUR.
 *
 * Mağaza ve harita bağlantıları siteye harici bağlantı olarak basılır;
 * `http://` bir bağlantıyı karışık içerik (mixed content) hâline getirir ve
 * tarayıcı sessizce engelleyebilir. Boş bırakmak serbesttir — pazaryeri
 * bağlantısı yoksa o butonun HİÇ gösterilmemesi zaten kuraldır.
 */
const optionalHttpsUrl = (label: string) =>
  z
    .string()
    .trim()
    .max(2000, `${label} çok uzun.`)
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .refine(
      (value) => value === null || /^https:\/\//i.test(value),
      `${label} https:// ile başlamalıdır.`,
    )
    .refine((value) => {
      if (value === null) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }, `${label} geçerli bir adres değil.`);

export const siteSettingsSchema = z.object({
  whatsapp_phone: emptyToNull(40, "WhatsApp numarası"),
  phone_display: emptyToNull(40, "Görünen telefon"),
  address_line: emptyToNull(300, "Adres"),
  working_hours: emptyToNull(200, "Çalışma saatleri"),
  maps_url: optionalHttpsUrl("Harita bağlantısı"),
  store_amazon_url: optionalHttpsUrl("Amazon mağaza bağlantısı"),
  store_hepsiburada_url: optionalHttpsUrl("Hepsiburada mağaza bağlantısı"),
  store_trendyol_url: optionalHttpsUrl("Trendyol mağaza bağlantısı"),
  store_pazarama_url: optionalHttpsUrl("Pazarama mağaza bağlantısı"),
  whatsapp_template_product: emptyToNull(2000, "Ürün mesajı şablonu"),
  whatsapp_template_service: emptyToNull(2000, "Servis mesajı şablonu"),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;

// --- Ana sayfa bölümleri --------------------------------------------------

/*
  Bölüm listesi FORMDAN GELMEZ, koddaki kayıttan gelir; formdan gelen tek şey
  her bölümün açık olup olmadığı ve onay durumudur. Bu yüzden şema kimlikleri
  doğrulamaz — aksiyon, yalnız KAYITTA VAR OLAN ve zorunlu OLMAYAN kimlikleri
  toplar, bilinmeyen bir kimlik hiç şemaya ulaşmaz.

  Onay durumu değerleri kayıttan gelir; burada YENİDEN YAZILMAZ. Kayda yeni
  bir durum eklenirse şema onu kendiliğinden kabul eder.
*/
export const homeSectionContentStatusSchema = z.enum(HOME_SECTION_CONTENT_STATUSES, {
  message: "Geçersiz içerik durumu.",
});

export const homeSectionOverrideSchema = z.object({
  enabled: z.boolean(),
  contentStatus: homeSectionContentStatusSchema,
});

export const homeSectionsConfigSchema = z.record(z.string(), homeSectionOverrideSchema);

export type HomeSectionsConfigInput = z.infer<typeof homeSectionsConfigSchema>;

// --- Görsel yükleme -------------------------------------------------------

/** 5 MB. Ürün görseli için fazlasıyla yeterli; panelden yanlışlıkla RAW yüklenmesini engeller. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

/**
 * Yüklenen dosyayı doğrular.
 *
 * NOT: `type` ve `size` istemciden gelen BEYANLARDIR. Bunlara tek başına
 * güvenilmez — Storage bucket'ı da `allowed_mime_types` ve
 * `file_size_limit` ile sınırlıdır (migrasyon). Yani reddetme iki katmanda
 * gerçekleşir; bu fonksiyon kullanıcıya anlaşılır mesajı veren katmandır.
 */
export function validateImageFile(file: File): { ok: true } | { ok: false; message: string } {
  if (file.size === 0) {
    return { ok: false, message: "Dosya boş görünüyor." };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      ok: false,
      message: `Dosya çok büyük (${mb} MB). En fazla ${MAX_IMAGE_BYTES / (1024 * 1024)} MB olabilir.`,
    };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type as AllowedImageType)) {
    return {
      ok: false,
      message: `Desteklenmeyen dosya türü (${file.type || "bilinmiyor"}). JPEG, PNG, WebP veya AVIF yükleyin.`,
    };
  }

  return { ok: true };
}

export const imageMetaSchema = z.object({
  altText: z
    .string()
    .trim()
    .max(300, "Alternatif metin en fazla 300 karakter olabilir.")
    // Boş dize MEŞRUDUR: dekoratif görsel demektir (şemada `not null default ''`).
    .default(""),
});
