import type {
  MarketplaceLinkDraft,
  ProductFormValues,
  SpecDraft,
} from "@/components/admin/ProductForm";
import type { AvailabilityStatus, Marketplace, MarketplaceLinkTarget } from "@/lib/data/types";

/*
  GÖNDERİLEN FORMU GERİ OKUMA.

  `product-form-values.ts` veritabanı satırını forma çevirir; bu dosya ise
  kullanıcının GÖNDERDİĞİ formu forma geri çevirir. İkisi ayrı durur çünkü
  buradaki kod saftır: veritabanı bilmez, `server-only` değildir ve doğrudan
  test edilir. Aksiyonun hata yolundaki tek görevi budur ve o yol sessizce
  bozulursa kullanıcı verisini kaybeder — bu yüzden testi kolay olmalıdır.
*/

/*
  DOĞRULAMAZ. Bilinçlidir.

  Bu dönüşümün tek işi, doğrulama hatasında kullanıcının gönderdiği HER ŞEYİ
  eksiksiz forma geri basabilmektir. Buradan geçen değer hiçbir zaman
  veritabanına gitmez — o yolun tek kapısı `productSchema`'dır ve o kapı
  değişmedi. Burada bir değeri "temizlemek" tam tersi bir zarar verirdi:
  kullanıcı yazdığından farklı bir şey görür ve neyi düzelteceğini bilemez.

  Geçersiz JSON tek istisnadır: ayrıştırılamayan bir koleksiyonu boş diziye
  çevirmek satırları sessizce yok etmek olurdu. Bu durumda `null` döner ve
  çağıran taraf bunu bir hata olarak bildirir.
*/

function text(formData: FormData, key: string): string {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

/** Formdaki JSON koleksiyonunu okur. `null` = içerik ayrıştırılamadı. */
export function parseCollectionField(formData: FormData, key: string): unknown[] | null {
  const raw = formData.get(key);
  if (typeof raw !== "string" || raw.trim() === "") return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/*
  Seçim listeleri (select/radio) İZİN LİSTESİNDEN geçirilir. Serbest metin
  alanları geçirilmez — oradaki amaç kullanıcının yazdığını aynen geri
  vermektir. Seçimlerde ise listede olmayan bir değeri forma basmak `select`
  kutusunu "hiçbiri seçili değil" hâline düşürür ve kullanıcı hangi seçeneği
  kaybettiğini göremez. Tanınmayan değer bilinen bir varsayılana düşer.
*/
function fromAllowList<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

const AVAILABILITY_VALUES: readonly AvailabilityStatus[] = [
  "in_stock",
  "limited",
  "on_order",
  "out_of_stock",
];
const STATUS_VALUES: readonly ProductFormValues["status"][] = [
  "draft",
  "active",
  "passive",
  "archived",
];
const MARKETPLACE_VALUES: readonly Marketplace[] = [
  "amazon",
  "hepsiburada",
  "trendyol",
  "pazarama",
  "other",
];
const LINK_TARGET_VALUES: readonly MarketplaceLinkTarget[] = ["product", "store"];

function specDrafts(raw: unknown[] | null): SpecDraft[] {
  if (raw === null) return [];
  return raw.map((entry) => {
    const row = (entry ?? {}) as Partial<SpecDraft>;
    return { label: String(row.label ?? ""), value: String(row.value ?? "") };
  });
}

function linkDrafts(raw: unknown[] | null): MarketplaceLinkDraft[] {
  if (raw === null) return [];
  return raw.map((entry) => {
    const row = (entry ?? {}) as Partial<MarketplaceLinkDraft>;
    return {
      marketplace: fromAllowList(String(row.marketplace ?? ""), MARKETPLACE_VALUES, "trendyol"),
      customLabel: String(row.customLabel ?? ""),
      url: String(row.url ?? ""),
      linkTarget: fromAllowList(String(row.linkTarget ?? ""), LINK_TARGET_VALUES, "product"),
      isActive: row.isActive !== false,
    };
  });
}

function idDrafts(raw: unknown[] | null): string[] {
  if (raw === null) return [];
  return raw.map((entry) => String(entry));
}

/**
 * Gönderilen formu, doğrulamadan geçmeden, formun anladığı biçime çevirir.
 *
 * Hata durumunda `ActionState.values` olarak geri gönderilir; form bunu kendi
 * durumuna basar ve tek bir alan bile kaybolmaz.
 */
export function productFormValuesFromFormData(formData: FormData): ProductFormValues {
  const id = text(formData, "id");
  const isOriginal = text(formData, "isOriginal");

  return {
    id: id === "" ? null : id,
    name: text(formData, "name"),
    slug: text(formData, "slug"),
    brandId: text(formData, "brandId"),
    categoryId: text(formData, "categoryId"),
    sku: text(formData, "sku"),
    shortDescription: text(formData, "shortDescription"),
    longDescription: text(formData, "longDescription"),
    price: text(formData, "price"),
    compareAtPrice: text(formData, "compareAtPrice"),
    availability: fromAllowList(text(formData, "availability"), AVAILABILITY_VALUES, "on_order"),
    isOriginal:
      isOriginal === "original" || isOriginal === "compatible" ? isOriginal : "unknown",
    boxContents: text(formData, "boxContents"),
    installationNotes: text(formData, "installationNotes"),
    isFeatured: formData.get("isFeatured") === "on",
    displayOrder: text(formData, "displayOrder"),
    status: fromAllowList(text(formData, "status"), STATUS_VALUES, "draft"),
    seoTitle: text(formData, "seoTitle"),
    seoDescription: text(formData, "seoDescription"),
    specs: specDrafts(parseCollectionField(formData, "specs")),
    compatibleModelIds: idDrafts(parseCollectionField(formData, "compatibleModelIds")),
    marketplaceLinks: linkDrafts(parseCollectionField(formData, "marketplaceLinks")),
    relatedProductIds: idDrafts(parseCollectionField(formData, "relatedProductIds")),
  };
}
