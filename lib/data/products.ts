import { getPublicClient } from "@/lib/supabase/public-client";
import { isSupabaseConfigured, showDemoContent } from "@/lib/supabase/env";
import { fail, ok, type DataResult } from "@/lib/data/result";
import type {
  Paginated,
  Pagination,
  ProductDetail,
  ProductFilters,
  ProductListItem,
  ProductSort,
} from "@/lib/data/types";

/*
  Ürün sorguları.

  GÜVENLİK NOTU: bu dosyadaki hiçbir sorgu `status = 'active'` filtresi yazmaz.
  Bu bilinçlidir — görünürlüğü RLS politikası belirler (supabase/migrations/
  ...rls.sql). Filtre yazmak korumayı buraya taşırdı; unutulduğunda taslak
  içerik sızardı. Anon istemci yalnız aktif satırları GÖREBİLİR.

  `is_demo` ise ayrı bir konudur: demo satırlar zaten draft olduğu için anonime
  görünmez. Yine de yayına alınmış bir demo satır kalırsa `showDemoContent`
  kapalıyken listelerden çıkarılır (üretimde daima kapalıdır).
*/

/*
  Ortak seçim: ürün + marka + kategori + ana görsel.

  GÖMÜLÜ KAYNAK FİLTRESİ TUZAĞI (PostgREST):
  `.eq('categories.slug', x)` gömülü kaynağa yazılan bir filtredir. Gömme
  VARSAYILAN olarak LEFT JOIN'dir; bu yüzden filtre ÜST SATIRLARI ELEMEZ —
  yalnız eşleşmeyen satırların gömülü nesnesini `null` yapar. Sonuç: sorgu
  TÜM ürünleri döndürür, üstelik `total` sayacı da yanlış olur.

  Üst satırların da elenmesi için gömme `!inner` OLMALIDIR. Ancak `!inner`
  yalnız filtre varken doğrudur: markasız/kategorisiz ürünler aksi hâlde
  listeden tümüyle düşerdi (`brand_id` ve `category_id` NULL olabilir).

  Bu yüzden seçim metni filtreye göre kurulur.
*/
/*
  DÖNÜŞ TİPİ `string` DEĞİLDİR — bilerek.

  supabase-js seçim metnini TİP DÜZEYİNDE ayrıştırır ve sonuç satırının tipini
  oradan üretir. Bu ayrıştırma yalnız metin bir LİTERAL tip olduğunda çalışır;
  `string`'e genişlerse çıkarım çöker ve çağrı yerlerinde `as unknown as`
  gerekirdi.

  Bu yüzden gömme adları ve şablon `as const` ile literal tutulur: TypeScript
  şablon literal tipini interpolasyon boyunca korur, böylece dönüş tipi dört
  olası seçim metninin BİRLEŞİMİ olur ve çıkarım ayakta kalır — seçim metnini
  dört kez kopyalamak zorunda kalmadan.

  Pratik kazanç: seçime bir sütun eklenip `RawListRow`'a eklenmezse (veya tersi)
  derleyici bunu YAKALAR. Cast'li hâlde bu sessizce kaçardı.
*/
function buildListSelect(filters: ProductFilters) {
  const brandEmbed = filters.brandSlug ? ("brands!inner" as const) : ("brands" as const);
  const categoryEmbed = filters.categorySlug
    ? ("categories!inner" as const)
    : ("categories" as const);

  return `
  id, name, slug, sku, short_description,
  price_minor, compare_at_price_minor, currency,
  availability, is_featured, is_demo, display_order,
  brand:${brandEmbed} ( id, name, slug ),
  category:${categoryEmbed} ( id, name, slug ),
  images:product_images ( storage_path, alt_text, is_primary )
` as const;
}

/** Filtresiz seçim (detay sorgusu ve elle seçilmiş ilgili ürünler için). */
const LIST_SELECT = buildListSelect({});

interface RawListRow {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  short_description: string | null;
  price_minor: number | null;
  compare_at_price_minor: number | null;
  currency: string;
  availability: ProductListItem["availability"];
  is_featured: boolean;
  is_demo: boolean;
  display_order: number;
  brand: { id: string; name: string; slug: string } | null;
  category: { id: string; name: string; slug: string } | null;
  images: { storage_path: string; alt_text: string; is_primary: boolean }[] | null;
}

function toListItem(row: RawListRow): ProductListItem {
  const primary = row.images?.find((image) => image.is_primary) ?? row.images?.[0] ?? null;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    shortDescription: row.short_description,
    priceMinor: row.price_minor,
    compareAtPriceMinor: row.compare_at_price_minor,
    currency: row.currency,
    availability: row.availability,
    isFeatured: row.is_featured,
    isDemo: row.is_demo,
    brand: row.brand,
    category: row.category,
    primaryImage: primary ? { storagePath: primary.storage_path, altText: primary.alt_text } : null,
  };
}

const DEFAULT_PER_PAGE = 24;
const MAX_PER_PAGE = 100;

/**
 * Ürün listesi — filtre, sıralama ve sayfalama ile.
 *
 * Veri yoksa `ok: true` + boş dizi döner (meşru sonuç). Sorgu patlarsa
 * `ok: false` döner — boş dizi ile hatayı karıştırmayız.
 */
export async function listProducts(
  filters: ProductFilters = {},
  sort: ProductSort = "manual",
  pagination: Pagination = {},
): Promise<DataResult<Paginated<ProductListItem>>> {
  if (!isSupabaseConfigured) {
    return fail("not_configured", "Supabase yapılandırılmamış.");
  }

  const page = Math.max(1, pagination.page ?? 1);
  const perPage = Math.min(MAX_PER_PAGE, Math.max(1, pagination.perPage ?? DEFAULT_PER_PAGE));
  const from = (page - 1) * perPage;

  let query = getPublicClient()
    .from("products")
    .select(buildListSelect(filters), { count: "exact" });

  // Filtre yolları `!inner` gömme ile eşleşir (bkz. buildListSelect).
  if (filters.brandSlug) query = query.eq("brands.slug", filters.brandSlug);
  if (filters.categorySlug) query = query.eq("categories.slug", filters.categorySlug);
  if (filters.featuredOnly) query = query.eq("is_featured", true);
  if (filters.availability?.length) query = query.in("availability", filters.availability);
  if (!showDemoContent) query = query.eq("is_demo", false);

  if (filters.search?.trim()) {
    const term = filters.search.trim().replaceAll("%", "").replaceAll(",", " ");
    query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
  }

  if (filters.deviceModelId) {
    // Uyumluluk çoktan-çoğa: önce eşleşen ürün id'lerini topla.
    const compat = await getPublicClient()
      .from("product_compatibility")
      .select("product_id")
      .eq("device_model_id", filters.deviceModelId);

    if (compat.error) {
      return fail("query_failed", compat.error.message, compat.error.code);
    }
    const ids = compat.data.map((row) => row.product_id);
    if (ids.length === 0) {
      return ok({ items: [], total: 0, page, perPage, pageCount: 0 });
    }
    query = query.in("id", ids);
  }

  switch (sort) {
    case "name_asc":
      query = query.order("name", { ascending: true });
      break;
    case "name_desc":
      query = query.order("name", { ascending: false });
      break;
    // Fiyatsız ürünler (NULL) her zaman SONA gider — fiyat sıralaması onları
    // "en ucuz" gibi göstermemeli.
    case "price_asc":
      query = query.order("price_minor", { ascending: true, nullsFirst: false });
      break;
    case "price_desc":
      query = query.order("price_minor", { ascending: false, nullsFirst: false });
      break;
    default:
      query = query.order("display_order", { ascending: true }).order("name", { ascending: true });
  }

  const { data, error, count } = await query.range(from, from + perPage - 1);

  if (error) return fail("query_failed", error.message, error.code);

  const total = count ?? 0;
  return ok({
    items: data.map(toListItem),
    total,
    page,
    perPage,
    pageCount: Math.ceil(total / perPage),
  });
}

/** Öne çıkan ürünler (bilgi dosyası §6 — "En Çok Satanlar" iddiası KULLANILMAZ). */
export async function listFeaturedProducts(limit = 8): Promise<DataResult<ProductListItem[]>> {
  const result = await listProducts({ featuredOnly: true }, "manual", { perPage: limit });
  return result.ok ? ok(result.data.items) : result;
}

/** Slug ile tek ürün — detay sayfasının ihtiyaç duyduğu her şeyle. */
export async function getProductBySlug(slug: string): Promise<DataResult<ProductDetail>> {
  if (!isSupabaseConfigured) {
    return fail("not_configured", "Supabase yapılandırılmamış.");
  }

  const { data, error } = await getPublicClient()
    .from("products")
    .select(
      `
      ${LIST_SELECT},
      long_description, is_original, box_contents, installation_notes,
      seo_title, seo_description,
      all_images:product_images ( id, storage_path, alt_text, is_primary, display_order ),
      specs:product_specs ( id, label, value, display_order ),
      compatibility:product_compatibility (
        verified_note,
        device_model:device_models ( id, name, slug, brand:brands ( name, slug ) )
      ),
      links:product_marketplace_links ( id, marketplace, custom_label, url, link_target, is_active, display_order )
    `,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) return fail("query_failed", error.message, error.code);
  if (!data) return fail("not_found", `Ürün bulunamadı: ${slug}`);

  const row = data;

  const byOrder = <T extends { display_order: number }>(a: T, b: T) =>
    a.display_order - b.display_order;

  return ok({
    ...toListItem(row),
    longDescription: row.long_description,
    isOriginal: row.is_original,
    boxContents: row.box_contents,
    installationNotes: row.installation_notes,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    images: [...(row.all_images ?? [])].sort(byOrder).map((image) => ({
      id: image.id,
      storagePath: image.storage_path,
      altText: image.alt_text,
      isPrimary: image.is_primary,
    })),
    specs: [...(row.specs ?? [])].sort(byOrder).map((spec) => ({
      id: spec.id,
      label: spec.label,
      value: spec.value,
    })),
    compatibleModels: (row.compatibility ?? [])
      .filter((entry) => entry.device_model !== null)
      .map((entry) => ({
        id: entry.device_model!.id,
        name: entry.device_model!.name,
        slug: entry.device_model!.slug,
        brandName: entry.device_model!.brand?.name ?? "",
        brandSlug: entry.device_model!.brand?.slug ?? "",
        verifiedNote: entry.verified_note,
      }))
      .sort((a, b) => a.brandName.localeCompare(b.brandName, "tr") || a.name.localeCompare(b.name, "tr")),
    // Pasif bağlantı hiç dönmez: bilgi dosyası §9 — bağlantı yoksa buton gösterilmez.
    marketplaceLinks: (row.links ?? [])
      .filter((link) => link.is_active)
      .sort(byOrder)
      .map((link) => ({
        id: link.id,
        marketplace: link.marketplace,
        customLabel: link.custom_label,
        url: link.url,
        linkTarget: link.link_target,
      })),
  });
}

/**
 * İlgili ürünler.
 *
 * Strateji (bilgi dosyası §7): önce yöneticinin ELLE seçtiği ilişkiler
 * (`related_products`). O tablo boşsa aynı kategoriden türetilir. Elle seçim
 * her zaman kazanır; otomatik türetme yalnız boşluğu doldurur.
 */
export async function getRelatedProducts(
  productId: string,
  categorySlug: string | null,
  limit = 4,
): Promise<DataResult<ProductListItem[]>> {
  if (!isSupabaseConfigured) {
    return fail("not_configured", "Supabase yapılandırılmamış.");
  }

  const curated = await getPublicClient()
    .from("related_products")
    .select("related_product_id, display_order")
    .eq("product_id", productId)
    .order("display_order", { ascending: true })
    .limit(limit);

  if (curated.error) return fail("query_failed", curated.error.message, curated.error.code);

  if (curated.data.length > 0) {
    const ids = curated.data.map((row) => row.related_product_id);
    const { data, error } = await getPublicClient()
      .from("products")
      .select(LIST_SELECT)
      .in("id", ids);

    if (error) return fail("query_failed", error.message, error.code);

    // Yöneticinin sırasını koru.
    const rank = new Map(ids.map((id, index) => [id, index]));
    return ok(
      data
        .map(toListItem)
        .sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0)),
    );
  }

  if (!categorySlug) return ok([]);

  const derived = await listProducts({ categorySlug }, "manual", { perPage: limit + 1 });
  if (!derived.ok) return derived;

  return ok(derived.data.items.filter((item) => item.id !== productId).slice(0, limit));
}
