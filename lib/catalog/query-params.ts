import type { ProductSort } from "@/lib/data/types";

/*
  Katalog URL sözleşmesi.

  Arayüz Türkçedir, bu yüzden sorgu parametreleri de Türkçedir (`?marka=`,
  `?kategori=`). Ancak veri katmanının tipleri İngilizcedir (`ProductSort`) —
  çeviri TEK yerde, burada yapılır. Sayfa bileşenleri ham `searchParams`
  sözlüğüne hiç dokunmaz.

  Bu dosya saf ve yan etkisizdir: React, env veya Supabase bilmez, doğrudan
  test edilebilir (`__tests__/catalog-query-params.test.ts`).
*/

/** Ham `searchParams` değeri: dizi gelebilir (`?marka=a&marka=b`). */
export type RawParam = string | string[] | undefined;
export type RawSearchParams = Record<string, RawParam>;

export const PARAM = {
  brand: "marka",
  category: "kategori",
  deviceModel: "model",
  search: "ara",
  sort: "sirala",
  page: "sayfa",
} as const;

/**
 * Sıralama seçenekleri.
 *
 * `manual` = yöneticinin `display_order` ile belirlediği sıra. Arayüzdeki adı
 * "Önerilen sıralama"dır — bu bir POPÜLERLİK İDDİASI DEĞİLDİR (bilgi dosyası
 * §6: ölçülemeyen "en çok satan" türü iddialar kullanılmaz).
 */
export const SORT_OPTIONS = [
  { value: "onerilen", label: "Önerilen sıralama", sort: "manual" },
  { value: "ad-az", label: "Ada göre (A→Z)", sort: "name_asc" },
  { value: "ad-za", label: "Ada göre (Z→A)", sort: "name_desc" },
  { value: "fiyat-artan", label: "Fiyat: önce düşük", sort: "price_asc" },
  { value: "fiyat-azalan", label: "Fiyat: önce yüksek", sort: "price_desc" },
] as const satisfies readonly { value: string; label: string; sort: ProductSort }[];

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const DEFAULT_SORT_VALUE: SortValue = "onerilen";

/** Tek değer alır; dizi gelirse İLKİNİ kullanır ve boşlukları kırpar. */
export function firstParam(value: RawParam): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

/** Bilinmeyen sıralama değeri sessizce varsayılana düşer. */
export function parseSort(value: RawParam): { value: SortValue; sort: ProductSort } {
  const raw = firstParam(value);
  const match = SORT_OPTIONS.find((option) => option.value === raw);
  const chosen = match ?? SORT_OPTIONS[0];
  return { value: chosen.value, sort: chosen.sort };
}

/**
 * Sayfa numarası. Geçersiz/negatif/çok büyük girdi 1'e düşer — kullanıcı
 * girdisi doğrudan `range()` hesabına girmez.
 */
export function parsePage(value: RawParam): number {
  const raw = firstParam(value);
  if (!raw) return 1;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 10_000) return 1;
  return parsed;
}

/*
  CİHAZ MODELİ REFERANSI

  `device_models.slug` YALNIZ MARKA İÇİNDE benzersizdir — şemadaki kısıt
  `UNIQUE (brand_id, slug)`'dır, `UNIQUE (slug)` değil. Tohum verisinde beş
  ayrı markanın hepsinde `ornek-model-a` slug'ı bulunur.

  Bu yüzden URL'de yalnız model slug'ı taşınamaz: "?model=ornek-model-a"
  beş modele birden karşılık gelir ve ilk eşleşen seçilirse kullanıcı
  Ecovacs modelini seçtiği hâlde Dreame modeline göre filtrelenmiş sonuç
  görür — üstelik bunu FARK ETMEZ.

  Referans bu yüzden şemadaki kısıtla aynı bileşendir: `marka:model`.
*/
const MODEL_REF_SEPARATOR = ":";

export interface DeviceModelRef {
  brandSlug: string;
  modelSlug: string;
}

export function formatDeviceModelRef(brandSlug: string, modelSlug: string): string {
  return `${brandSlug}${MODEL_REF_SEPARATOR}${modelSlug}`;
}

/** Bozuk veya eksik parçalı referans `undefined` döner — yarım filtre uygulanmaz. */
export function parseDeviceModelRef(value: string | undefined): DeviceModelRef | undefined {
  if (!value) return undefined;

  const separatorIndex = value.indexOf(MODEL_REF_SEPARATOR);
  if (separatorIndex <= 0) return undefined;

  const brandSlug = value.slice(0, separatorIndex).trim();
  const modelSlug = value.slice(separatorIndex + 1).trim();
  if (!brandSlug || !modelSlug) return undefined;

  return { brandSlug, modelSlug };
}

export interface CatalogQuery {
  brandSlug?: string;
  categorySlug?: string;
  /**
   * Cihaz modeli referansı, ham `marka:model` biçiminde. Çözümleme (id'ye
   * çevirme) sayfa katmanında yapılır — model listesi orada bulunur.
   */
  deviceModelRef?: string;
  search?: string;
  sortValue: SortValue;
  sort: ProductSort;
  page: number;
}

export function parseCatalogQuery(params: RawSearchParams): CatalogQuery {
  const { value: sortValue, sort } = parseSort(params[PARAM.sort]);

  return {
    brandSlug: firstParam(params[PARAM.brand]),
    categorySlug: firstParam(params[PARAM.category]),
    deviceModelRef: firstParam(params[PARAM.deviceModel]),
    search: firstParam(params[PARAM.search]),
    sortValue,
    sort,
    page: parsePage(params[PARAM.page]),
  };
}

/** Kullanıcı herhangi bir daraltma uyguladı mı — boş durum metnini bu belirler. */
export function hasActiveFilters(query: CatalogQuery): boolean {
  return Boolean(query.brandSlug || query.categorySlug || query.deviceModelRef || query.search);
}

/**
 * Katalog URL'i kurar. Varsayılan değerler (1. sayfa, önerilen sıralama)
 * URL'e YAZILMAZ — aynı liste için tek bir kanonik adres kalsın diye.
 */
export function buildCatalogHref(query: Partial<CatalogQuery>, basePath = "/urunler"): string {
  const search = new URLSearchParams();

  if (query.brandSlug) search.set(PARAM.brand, query.brandSlug);
  if (query.categorySlug) search.set(PARAM.category, query.categorySlug);
  if (query.deviceModelRef) search.set(PARAM.deviceModel, query.deviceModelRef);
  if (query.search) search.set(PARAM.search, query.search);
  if (query.sortValue && query.sortValue !== DEFAULT_SORT_VALUE) {
    search.set(PARAM.sort, query.sortValue);
  }
  if (query.page && query.page > 1) search.set(PARAM.page, String(query.page));

  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
