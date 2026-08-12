/*
  Alan tipleri — TAMAMI şemadan türetilir.

  `lib/supabase/database.types.ts` üretilmiş dosyadır (elle düzenlenmez);
  `npm run db:types` ile yeniden üretilir. Buradaki her tip ondan türediği için
  şema değişince typecheck kırılır — senkron olmayan elle yazılmış tip yoktur.
*/
import type { Database } from "@/lib/supabase/database.types";

type Tables = Database["public"]["Tables"];
type Enums = Database["public"]["Enums"];

// --- Enum'lar -------------------------------------------------------------

/** Yayın durumu. Kalıcı silme yok; arşivleme esas. */
export type PublicationStatus = Enums["publication_status"];

/**
 * Bulunabilirlik. AvailabilityBadge bu tipi tüketir — uyumsuz bir değer
 * typecheck'ten geçemez.
 */
export type AvailabilityStatus = Enums["availability_status"];

export type Marketplace = Enums["marketplace"];
export type MarketplaceLinkTarget = Enums["marketplace_link_target"];

// --- Satır tipleri --------------------------------------------------------

export type BrandRow = Tables["brands"]["Row"];
export type CategoryRow = Tables["categories"]["Row"];
export type DeviceModelRow = Tables["device_models"]["Row"];
export type ProductRow = Tables["products"]["Row"];
export type ProductImageRow = Tables["product_images"]["Row"];
export type ProductSpecRow = Tables["product_specs"]["Row"];
export type MarketplaceLinkRow = Tables["product_marketplace_links"]["Row"];
export type ServiceRow = Tables["services"]["Row"];
export type SiteSettingRow = Tables["site_settings"]["Row"];

// --- Birleşik görünümler --------------------------------------------------

/** Katalog kartı için gereken en küçük ürün gösterimi. */
export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  shortDescription: string | null;
  /** Kuruş cinsinden; `null` → "Fiyat için iletişime geçin". */
  priceMinor: number | null;
  compareAtPriceMinor: number | null;
  currency: string;
  availability: AvailabilityStatus;
  isFeatured: boolean;
  isDemo: boolean;
  brand: Pick<BrandRow, "id" | "name" | "slug"> | null;
  category: Pick<CategoryRow, "id" | "name" | "slug"> | null;
  primaryImage: { storagePath: string; altText: string } | null;
}

/** Uyumlu cihaz — marka adıyla düzleştirilmiş. */
export interface CompatibleModel {
  id: string;
  name: string;
  slug: string;
  brandName: string;
  brandSlug: string;
  /** `null` = uyumluluk doğrulanmamış (bilgi dosyası §20). */
  verifiedNote: string | null;
}

export interface ProductMarketplaceLink {
  id: string;
  marketplace: Marketplace;
  /** 'other' için zorunlu görünen ad; diğerlerinde `null`. */
  customLabel: string | null;
  url: string;
  linkTarget: MarketplaceLinkTarget;
}

/** Ürün detay sayfasının ihtiyaç duyduğu tam gösterim (bilgi dosyası §7). */
export interface ProductDetail extends ProductListItem {
  longDescription: string | null;
  /** `null` = orijinal/uyumlu bilgisi DOĞRULANMAMIŞ. `true`/`false` doğrulanmış. */
  isOriginal: boolean | null;
  boxContents: string | null;
  installationNotes: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  images: { id: string; storagePath: string; altText: string; isPrimary: boolean }[];
  specs: { id: string; label: string; value: string }[];
  compatibleModels: CompatibleModel[];
  marketplaceLinks: ProductMarketplaceLink[];
}

// --- Sorgu girdileri ------------------------------------------------------

export interface ProductFilters {
  brandSlug?: string;
  categorySlug?: string;
  /** Uyumlu cihaz modeli slug'ı (marka içinde benzersiz olduğu için marka da gerekir). */
  deviceModelId?: string;
  availability?: AvailabilityStatus[];
  featuredOnly?: boolean;
  /** Ad ve ürün kodunda arama. */
  search?: string;
}

export type ProductSort = "manual" | "name_asc" | "name_desc" | "price_asc" | "price_desc";

export interface Pagination {
  /** 1 tabanlı. */
  page?: number;
  perPage?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}
