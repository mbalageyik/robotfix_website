import "server-only";

import { getServerClient } from "@/lib/supabase/server-client";
import { fail, ok, type DataResult } from "@/lib/data/result";
import {
  HOMEPAGE_SECTIONS_SETTING_KEY,
  parseHomeSectionsConfig,
  type HomeSectionsConfig,
} from "@/lib/home/section-registry";
import type {
  AvailabilityStatus,
  BrandRow,
  CategoryRow,
  DeviceModelRow,
  Paginated,
  PublicationStatus,
  ServiceRow,
} from "@/lib/data/types";

/*
  YÖNETİM PANELİ OKUMALARI.

  `lib/data/*` genel (anon) istemciyle çalışır ve yalnız `active` satırları
  görür. Panelin taslak/pasif/arşiv satırlarını da görmesi gerekir.

  BUNU SERVICE ROLE İLE YAPMIYORUZ. Yöneticinin KENDİ oturumu kullanılır;
  RLS'teki "yönetici tam yetkili" politikası (`for all ... using is_admin()`)
  izin verici (permissive) olduğu için "aktifleri okur" politikasıyla VEYA'lanır
  ve yönetici her durumu görür. Böylece RLS ikinci savunma hattı olarak
  yerinde kalır: uygulama yetki kontrolünü atlasa bile veritabanı tutar.

  Service role kullansaydık RLS tamamen devre dışı kalırdı ve panelde bir hata
  tüm veriyi açığa çıkarabilirdi.
*/

const ADMIN_PRODUCT_SELECT = `
  id, name, slug, sku, status, availability, is_featured, is_demo,
  price_minor, compare_at_price_minor, currency, display_order, updated_at,
  brand:brands ( id, name, slug ),
  category:categories ( id, name, slug ),
  images:product_images ( id )
`;

export interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  status: PublicationStatus;
  availability: AvailabilityStatus;
  isFeatured: boolean;
  isDemo: boolean;
  priceMinor: number | null;
  compareAtPriceMinor: number | null;
  currency: string;
  displayOrder: number;
  updatedAt: string;
  brand: { id: string; name: string; slug: string } | null;
  category: { id: string; name: string; slug: string } | null;
  imageCount: number;
}

export interface AdminProductFilters {
  search?: string;
  status?: PublicationStatus;
  brandId?: string;
  categoryId?: string;
  page?: number;
}

export const ADMIN_PAGE_SIZE = 20;

export async function listAdminProducts(
  filters: AdminProductFilters = {},
): Promise<DataResult<Paginated<AdminProductRow>>> {
  const supabase = await getServerClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * ADMIN_PAGE_SIZE;

  let query = supabase.from("products").select(ADMIN_PRODUCT_SELECT, { count: "exact" });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.brandId) query = query.eq("brand_id", filters.brandId);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);

  if (filters.search?.trim()) {
    // `%` ve `,` PostgREST `or` sözdizimini bozar; temizlenir.
    const term = filters.search.trim().replaceAll("%", "").replaceAll(",", " ");
    query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
  }

  const { data, error, count } = await query
    .order("display_order", { ascending: true })
    .order("name", { ascending: true })
    .range(from, from + ADMIN_PAGE_SIZE - 1);

  if (error) return fail("query_failed", error.message, error.code);

  const total = count ?? 0;
  return ok({
    items: (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      sku: row.sku,
      status: row.status,
      availability: row.availability,
      isFeatured: row.is_featured,
      isDemo: row.is_demo,
      priceMinor: row.price_minor,
      compareAtPriceMinor: row.compare_at_price_minor,
      currency: row.currency,
      displayOrder: row.display_order,
      updatedAt: row.updated_at,
      brand: row.brand,
      category: row.category,
      imageCount: row.images?.length ?? 0,
    })),
    total,
    page,
    perPage: ADMIN_PAGE_SIZE,
    pageCount: Math.ceil(total / ADMIN_PAGE_SIZE),
  });
}

/** Ürün düzenleme formunun ihtiyaç duyduğu tam kayıt (alt tablolar dâhil). */
export async function getAdminProduct(id: string) {
  const supabase = await getServerClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      images:product_images ( id, storage_path, alt_text, is_primary, display_order ),
      specs:product_specs ( id, label, value, display_order ),
      compatibility:product_compatibility ( device_model_id ),
      links:product_marketplace_links ( id, marketplace, custom_label, url, link_target, is_active, display_order ),
      related:related_products!related_products_product_id_fkey ( related_product_id, display_order )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return fail("query_failed", error.message, error.code);
  if (!data) return fail("not_found", "Ürün bulunamadı.");
  return ok(data);
}

// --- Robot Fix Seçkisi (öne çıkan ürünler) --------------------------------

/*
  SEÇKİ SORGUSU.

  Ana sayfadaki `listFeaturedProducts()` ile AYNI SIRALAMAYI kullanır
  (`display_order` artan, sonra `name`). Panelde farklı bir sıra göstermek,
  yöneticinin "yukarı taşı" dediği satırın ana sayfada başka bir yere gitmesi
  demek olurdu.

  Fark yalnız GÖRÜNÜRLÜKTE: bu sorgu yöneticinin oturumuyla çalışır ve taslak,
  pasif, arşiv ve örnek satırları da görür. Ana sayfa sorgusu onları göremez
  (RLS + demo bayrağı) — ekran bu farkı satır satır söyler.
*/
const ADMIN_FEATURED_SELECT = `
  id, name, slug, status, is_demo, display_order,
  images:product_images ( storage_path, alt_text, is_primary, display_order )
`;

export interface AdminFeaturedProductRow {
  id: string;
  name: string;
  slug: string;
  status: PublicationStatus;
  isDemo: boolean;
  displayOrder: number;
  primaryImage: { storagePath: string; altText: string } | null;
}

export async function listAdminFeaturedProducts(): Promise<
  DataResult<AdminFeaturedProductRow[]>
> {
  const supabase = await getServerClient();

  const { data, error } = await supabase
    .from("products")
    .select(ADMIN_FEATURED_SELECT)
    .eq("is_featured", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) return fail("query_failed", error.message, error.code);

  return ok(
    (data ?? []).map((row) => {
      // Ana görsel yoksa en küçük sıralı görsel gösterilir — kartlardaki kural.
      const images = [...(row.images ?? [])].sort((a, b) => a.display_order - b.display_order);
      const primary = images.find((image) => image.is_primary) ?? images[0] ?? null;

      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        status: row.status,
        isDemo: row.is_demo,
        displayOrder: row.display_order,
        primaryImage: primary
          ? { storagePath: primary.storage_path, altText: primary.alt_text }
          : null,
      };
    }),
  );
}

// --- Taksonomi (panel: tüm durumlar) --------------------------------------

export async function listAdminBrands(): Promise<DataResult<BrandRow[]>> {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("display_order")
    .order("name");
  if (error) return fail("query_failed", error.message, error.code);
  return ok(data);
}

export async function listAdminCategories(): Promise<DataResult<CategoryRow[]>> {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order")
    .order("name");
  if (error) return fail("query_failed", error.message, error.code);
  return ok(data);
}

export interface AdminDeviceModelRow extends DeviceModelRow {
  brandName: string;
}

export async function listAdminDeviceModels(): Promise<DataResult<AdminDeviceModelRow[]>> {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from("device_models")
    .select("*, brand:brands ( name )")
    .order("name");

  if (error) return fail("query_failed", error.message, error.code);

  return ok(
    (data ?? []).map(({ brand, ...model }) => ({
      ...model,
      brandName: brand?.name ?? "—",
    })),
  );
}

export async function listAdminServices(): Promise<DataResult<ServiceRow[]>> {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("display_order")
    .order("name");
  if (error) return fail("query_failed", error.message, error.code);
  return ok(data);
}

/**
 * Taksonomi kayıtlarına bağlı kayıt sayıları.
 *
 * NEDEN LİSTEDE GÖSTERİLİR: "bağlı kayıt varsa silme engellensin/uyarılsın"
 * gereksinimi, uyarıyı kullanıcı arşivleme düğmesine BASMADAN ÖNCE görmesini
 * gerektirir. Aksiyon sonrası mesajda söylemek geç kalmış bir uyarıdır.
 *
 * Tek seferde okunup bellekte gruplanır: kayıt başına ayrı sayım sorgusu
 * atmak N+1 olurdu ve bu tablolar zaten küçüktür.
 */
export interface DependencyCounts {
  productsByBrand: Record<string, number>;
  modelsByBrand: Record<string, number>;
  productsByCategory: Record<string, number>;
  childrenByCategory: Record<string, number>;
  productsByDeviceModel: Record<string, number>;
}

export async function getDependencyCounts(): Promise<DataResult<DependencyCounts>> {
  const supabase = await getServerClient();

  const [products, models, categories, compatibility] = await Promise.all([
    supabase.from("products").select("brand_id, category_id"),
    supabase.from("device_models").select("brand_id"),
    supabase.from("categories").select("parent_id"),
    supabase.from("product_compatibility").select("device_model_id"),
  ]);

  const firstError = products.error ?? models.error ?? categories.error ?? compatibility.error;
  if (firstError) return fail("query_failed", firstError.message, firstError.code);

  const tally = (rows: (string | null)[]): Record<string, number> => {
    const counts: Record<string, number> = {};
    for (const key of rows) {
      if (key) counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  };

  return ok({
    productsByBrand: tally((products.data ?? []).map((row) => row.brand_id)),
    modelsByBrand: tally((models.data ?? []).map((row) => row.brand_id)),
    productsByCategory: tally((products.data ?? []).map((row) => row.category_id)),
    childrenByCategory: tally((categories.data ?? []).map((row) => row.parent_id)),
    productsByDeviceModel: tally((compatibility.data ?? []).map((row) => row.device_model_id)),
  });
}

/**
 * "İlgili ürünler" seçicisinin listesi — yalnız kimlik ve ad.
 *
 * Sayfalanmaz: seçici tüm katalog içinden seçim yaptırır ve sayfalanmış bir
 * onay kutusu listesi seçimi sessizce kaybettirir. Alan sayısı ikiye
 * indirildiği için yüzlerce satır bile ucuzdur.
 *
 * Arşivlenmiş ürünler DIŞARIDA bırakılır: arşivlenmiş bir ürünü "ilgili ürün"
 * olarak önermek ziyaretçiyi görünmeyen bir sayfaya gönderirdi.
 */
export async function listProductOptions(
  excludeId?: string,
): Promise<DataResult<{ id: string; name: string }[]>> {
  const supabase = await getServerClient();

  let query = supabase.from("products").select("id, name").neq("status", "archived").order("name");

  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error) return fail("query_failed", error.message, error.code);
  return ok(data ?? []);
}

export async function getAdminSiteSettings(): Promise<DataResult<Record<string, string | null>>> {
  const supabase = await getServerClient();
  const { data, error } = await supabase.from("site_settings").select("key, value, description");
  if (error) return fail("query_failed", error.message, error.code);

  return ok(Object.fromEntries((data ?? []).map((row) => [row.key, row.value])));
}

/**
 * Ana sayfa bölüm yapılandırması — panel görünümü.
 *
 * `lib/data/site-settings.ts` içindeki genel okuyucudan AYRIDIR: bu, hatayı
 * YUTMAZ. Ziyaretçi için "okunamadı" ile "boş" aynı şeydir (ikisinde de
 * varsayılanlar geçerlidir); ama yönetici, kaydettiği değerin okunamadığını
 * BİLMELİDİR — aksi hâlde panel sessizce varsayılanları gösterir ve
 * kaydedilmiş ayarların üzerine yazılır.
 */
export async function getAdminHomeSectionsConfig(): Promise<DataResult<HomeSectionsConfig>> {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", HOMEPAGE_SECTIONS_SETTING_KEY)
    .maybeSingle();

  if (error) return fail("query_failed", error.message, error.code);

  return ok(parseHomeSectionsConfig(data?.value ?? null));
}

// --- Panel özeti ----------------------------------------------------------

export interface DashboardCounts {
  products: Record<PublicationStatus, number>;
  brands: number;
  categories: number;
  deviceModels: number;
  services: number;
  /** Dikkat gerektiren durumlar — uydurma değil, sorgudan gelir. */
  warnings: { label: string; count: number; href: string }[];
}

export async function getDashboardCounts(): Promise<DataResult<DashboardCounts>> {
  const supabase = await getServerClient();

  const [products, brands, categories, deviceModels, services, settings] = await Promise.all([
    supabase.from("products").select("status, price_minor, short_description, is_demo"),
    supabase.from("brands").select("id", { count: "exact", head: true }),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("device_models").select("id", { count: "exact", head: true }),
    supabase.from("services").select("id", { count: "exact", head: true }),
    supabase.from("site_settings").select("key, value"),
  ]);

  if (products.error) return fail("query_failed", products.error.message, products.error.code);

  const byStatus: Record<PublicationStatus, number> = {
    draft: 0,
    active: 0,
    passive: 0,
    archived: 0,
  };
  let activeWithoutPrice = 0;
  let activeWithoutDescription = 0;
  let activeDemo = 0;

  for (const row of products.data ?? []) {
    byStatus[row.status] += 1;
    if (row.status === "active") {
      if (row.price_minor === null) activeWithoutPrice += 1;
      if (!row.short_description) activeWithoutDescription += 1;
      if (row.is_demo) activeDemo += 1;
    }
  }

  const emptySettings = (settings.data ?? []).filter((row) => !row.value).length;

  const warnings = [
    {
      label: "Yayındaki ürün, kısa açıklaması yok",
      count: activeWithoutDescription,
      href: "/admin/urunler?durum=active",
    },
    {
      label: 'Yayındaki ürün, fiyatsız ("Fiyat için iletişime geçin")',
      count: activeWithoutPrice,
      href: "/admin/urunler?durum=active",
    },
    {
      label: "YAYINDA ÖRNEK VERİ — yayından kaldırılmalı",
      count: activeDemo,
      href: "/admin/urunler?durum=active",
    },
    {
      label: "Doldurulmamış site ayarı",
      count: emptySettings,
      href: "/admin/site-ayarlari",
    },
  ].filter((warning) => warning.count > 0);

  return ok({
    products: byStatus,
    brands: brands.count ?? 0,
    categories: categories.count ?? 0,
    deviceModels: deviceModels.count ?? 0,
    services: services.count ?? 0,
    warnings,
  });
}
