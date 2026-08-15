import Link from "next/link";
import { Button } from "@/components/ui/Button";
import {
  DEFAULT_SORT_VALUE,
  PARAM,
  SORT_OPTIONS,
  type CatalogQuery,
} from "@/lib/catalog/query-params";
import type { BrandRow, CategoryRow } from "@/lib/data/types";

/*
  Katalog filtreleri — İSTEMCİ JS OLMADAN çalışır.

  Sıradan bir `method="get"` formudur: tarayıcı alanları sorgu dizesine
  çevirir, sunucu yeniden render eder. Bu bilinçli bir karardır — filtreleme
  kataloğun temel işlevidir ve JS yüklenmeden ya da hata verdiğinde de
  çalışmalıdır (bilgi dosyası §14: 3D/JS katmanı olmadan da ürün bilgisi
  erişilebilir kalır).

  `sayfa` alanı forma DAHİL DEĞİLDİR: filtre değişince 1. sayfaya dönmek
  doğrudur, 7. sayfada kalmak değil.
*/

const selectClass =
  "min-h-11 w-full rounded-md border border-border-strong bg-surface-raised px-3 py-2 " +
  "text-body text-text focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-focus";

const labelClass = "flex flex-col gap-1.5 text-caption font-semibold text-text";

/**
 * Cihaz modeli seçeneği.
 *
 * Model adları marka içinde benzersizdir, GENELİNDE değil: birden çok markada
 * "Model A" bulunabilir. Bu yüzden seçenek metni markayla birlikte kurulur —
 * kullanıcı aynı adlı beş satırdan hangisinin kendi cihazı olduğunu ayırt
 * edebilmelidir. Etiket sayfa katmanında üretilir (marka listesi orada).
 */
export interface DeviceModelOption {
  id: string;
  /** URL değeri: `marka:model` referansı (bkz. `formatDeviceModelRef`). */
  slug: string;
  /** Görünen metin, ör. "Roborock — S7 MaxV". */
  label: string;
}

export interface CatalogFiltersProps {
  query: CatalogQuery;
  brands: BrandRow[];
  categories: CategoryRow[];
  deviceModels: DeviceModelOption[];
  /** Filtre uygulanmışsa "temizle" bağlantısı gösterilir. */
  showReset: boolean;
}

export function CatalogFilters({
  query,
  brands,
  categories,
  deviceModels,
  showReset,
}: CatalogFiltersProps) {
  return (
    <form
      method="get"
      action="/urunler"
      className="flex flex-col gap-4 rounded-lg border border-border bg-surface-raised p-4 sm:p-5"
      aria-labelledby="katalog-filtre-basligi"
    >
      <h2 id="katalog-filtre-basligi" className="text-h4">
        Ürünleri daralt
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className={labelClass} htmlFor="filtre-ara">
          Ürün ara
          <input
            id="filtre-ara"
            type="search"
            name={PARAM.search}
            defaultValue={query.search ?? ""}
            placeholder="Ürün adı veya kodu"
            className={selectClass}
          />
        </label>

        <label className={labelClass} htmlFor="filtre-marka">
          Marka
          <select
            id="filtre-marka"
            name={PARAM.brand}
            defaultValue={query.brandSlug ?? ""}
            className={selectClass}
          >
            <option value="">Tüm markalar</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.slug}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass} htmlFor="filtre-kategori">
          Kategori
          <select
            id="filtre-kategori"
            name={PARAM.category}
            defaultValue={query.categorySlug ?? ""}
            className={selectClass}
          >
            <option value="">Tüm kategoriler</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass} htmlFor="filtre-model">
          Uyumlu model
          <select
            id="filtre-model"
            name={PARAM.deviceModel}
            defaultValue={query.deviceModelRef ?? ""}
            className={selectClass}
          >
            <option value="">Tüm modeller</option>
            {deviceModels.map((model) => (
              <option key={model.id} value={model.slug}>
                {model.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className={`${labelClass} w-full sm:w-64`} htmlFor="filtre-sirala">
          Sıralama
          <select
            id="filtre-sirala"
            name={PARAM.sort}
            defaultValue={query.sortValue ?? DEFAULT_SORT_VALUE}
            className={selectClass}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          {showReset && (
            <Link
              href="/urunler"
              className="text-caption font-semibold text-link underline underline-offset-4 hover:text-link-hover"
            >
              Filtreleri temizle
            </Link>
          )}
          {/* JS kapalıyken de çalışır: sıradan bir submit butonu. */}
          <Button type="submit">Filtrele</Button>
        </div>
      </div>
    </form>
  );
}
