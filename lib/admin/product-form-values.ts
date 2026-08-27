import "server-only";

import { formatMinorForInput } from "@/lib/admin/money";
import type { ProductFormValues } from "@/components/admin/ProductForm";

/*
  Veritabanı satırı → form değerleri dönüşümü.

  AYRI DOSYA olmasının sebebi: hem "yeni ürün" hem "ürün düzenle" sayfası aynı
  dönüşüme ihtiyaç duyuyor ve dönüşümün tek yerde olması, bir alanın forma
  taşınmayı unutulmasını engelliyor.

  `null` → "" dönüşümü BİLİNÇLİDİR: HTML form alanları `null` taşıyamaz ve
  `defaultValue={null}` React'te kontrolsüz/kontrollü uyarısı üretir. Ters
  dönüşüm (boş dize → null) sunucuda zod tarafından yapılır.
*/

/** Kaydedilmemiş yeni ürünün başlangıç değerleri. */
export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  id: null,
  name: "",
  slug: "",
  brandId: "",
  categoryId: "",
  sku: "",
  shortDescription: "",
  longDescription: "",
  price: "",
  compareAtPrice: "",
  // Yeni ürün için en dürüst varsayılan: stok durumu henüz bilinmiyorsa
  // "Stokta" demek uydurmadır. "Siparişle" gerçek ve güvenli bir başlangıçtır.
  availability: "on_order",
  isOriginal: "unknown",
  boxContents: "",
  installationNotes: "",
  isFeatured: false,
  displayOrder: "0",
  // Yeni ürün DAİMA taslak doğar; yayına alma bilinçli bir ikinci adımdır.
  status: "draft",
  seoTitle: "",
  seoDescription: "",
  specs: [],
  compatibleModelIds: [],
  marketplaceLinks: [],
  relatedProductIds: [],
};

/** `getAdminProduct()` çıktısının forma taşınan alanları. */
interface AdminProductRecord {
  id: string;
  name: string;
  slug: string;
  brand_id: string | null;
  category_id: string | null;
  sku: string | null;
  short_description: string | null;
  long_description: string | null;
  price_minor: number | null;
  compare_at_price_minor: number | null;
  availability: ProductFormValues["availability"];
  is_original: boolean | null;
  box_contents: string | null;
  installation_notes: string | null;
  is_featured: boolean;
  display_order: number;
  status: ProductFormValues["status"];
  seo_title: string | null;
  seo_description: string | null;
  specs?: { label: string; value: string; display_order: number }[] | null;
  compatibility?: { device_model_id: string }[] | null;
  links?:
    | {
        marketplace: ProductFormValues["marketplaceLinks"][number]["marketplace"];
        custom_label: string | null;
        url: string;
        link_target: ProductFormValues["marketplaceLinks"][number]["linkTarget"];
        is_active: boolean;
        display_order: number;
      }[]
    | null;
  related?: { related_product_id: string; display_order: number }[] | null;
}

export function toProductFormValues(record: AdminProductRecord): ProductFormValues {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    brandId: record.brand_id ?? "",
    categoryId: record.category_id ?? "",
    sku: record.sku ?? "",
    shortDescription: record.short_description ?? "",
    longDescription: record.long_description ?? "",
    price: formatMinorForInput(record.price_minor),
    compareAtPrice: formatMinorForInput(record.compare_at_price_minor),
    availability: record.availability,
    /*
      ÜÇ DURUMLU ALAN: `null` "doğrulanmadı" demektir ve forma "unknown" olarak
      düşer (bilgi dosyası §20). `false` ise "uyumlu/muadil" iddiasının
      DOĞRULANMIŞ hâlidir — ikisi karıştırılırsa site doğrulanmamış bir iddiayı
      yayımlar. Bu yüzden `?? ` değil, açık bir null kontrolü kullanılır.
    */
    isOriginal: record.is_original === null ? "unknown" : record.is_original ? "original" : "compatible",
    boxContents: record.box_contents ?? "",
    installationNotes: record.installation_notes ?? "",
    isFeatured: record.is_featured,
    displayOrder: String(record.display_order),
    status: record.status,
    seoTitle: record.seo_title ?? "",
    seoDescription: record.seo_description ?? "",

    specs: [...(record.specs ?? [])]
      .sort((a, b) => a.display_order - b.display_order)
      .map((spec) => ({ label: spec.label, value: spec.value })),

    compatibleModelIds: (record.compatibility ?? []).map((row) => row.device_model_id),

    marketplaceLinks: [...(record.links ?? [])]
      .sort((a, b) => a.display_order - b.display_order)
      .map((link) => ({
        marketplace: link.marketplace,
        customLabel: link.custom_label ?? "",
        url: link.url,
        linkTarget: link.link_target,
        isActive: link.is_active,
      })),

    relatedProductIds: [...(record.related ?? [])]
      .sort((a, b) => a.display_order - b.display_order)
      .map((row) => row.related_product_id),
  };
}
