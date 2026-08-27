"use client";

import { useId, useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { ProductCard } from "@/components/catalog/ProductCard";
import { GridFourIcon, GridTwoIcon, ListIcon } from "@/components/ui/icons";
import { REDUCED_MOTION_QUERY, useMediaQuery } from "@/lib/hooks/use-media-query";
import {
  DEFAULT_LAYOUT_MODE,
  LAYOUTS,
  WIDE_SCREEN_QUERY,
  findLayout,
  isLayoutDisabled,
  layoutTransition,
  type LayoutMode,
} from "@/lib/catalog/layout-modes";
import type { ProductListItem } from "@/lib/data/types";

/*
  KATALOG GÖRÜNÜM DEĞİŞTİRİCİ — liste / 2 sütun / 4 sütun.

  BU BİR İLERİCİ GELİŞTİRMEDİR (progressive enhancement). Katalogun kendisi
  JS'siz çalışır: filtreler sıradan bir `method="get"` formudur
  (`CatalogFilters`) ve ürün listesi sunucuda render edilir. Bu bileşen de
  sunucuda render edilir — JS hiç yüklenmese bile HTML'de tam ürün listesi
  bulunur, yalnız görünüm değiştirme etkileşimi çalışmaz. Ürün bilgisine
  erişim hiçbir koşulda JS'e bağlanmaz (bilgi dosyası §14).

  VERİ: yeni bir sorgu YOK. Ürünler sayfanın sunucu bileşeninde
  `listProducts()` ile çekilir ve buraya prop olarak iner; bu dosya veri
  katmanına hiç dokunmaz.

  NEDEN `framer-motion`, `motion` DEĞİL: ikisi aynı kütüphanedir (`motion`,
  `framer-motion`'ın yeni adı). Projede `framer-motion@13` zaten kurulu ve üç
  bileşen tarafından kullanılıyor; `motion` paketini ayrıca kurmak aynı
  animasyon çalışma zamanının İKİNCİ bir kopyasını pakete eklerdi.
*/

/** Düzen → simge. Simgeler işaretlemeye aittir, bu yüzden veri tablosunda değil burada. */
const MODE_ICONS: Record<LayoutMode, typeof ListIcon> = {
  list: ListIcon,
  grid2: GridTwoIcon,
  grid4: GridFourIcon,
};

export interface ProductsLayoutToggleProps {
  products: ProductListItem[];
  /**
   * Kaç kartın görseli öncelikli yüklensin. Sayfa ilk açıldığında görünen
   * satır LCP adayıdır; gerisi tembel yüklenir.
   */
  priorityCount?: number;
}

export function ProductsLayoutToggle({ products, priorityCount = 4 }: ProductsLayoutToggleProps) {
  const [mode, setMode] = useState<LayoutMode>(DEFAULT_LAYOUT_MODE);
  const groupId = useId();

  /*
    `useMediaQuery` sunucuda DAİMA `false` döner (hidrasyon güvenliği için).
    Sorular bu yüzden "sunucuda üretilmesini istemediğimiz durum doğru tarafta"
    olacak şekilde yazıldı:
      - `isWide`: sunucu `false` → dört sütun düğmesi ilk HTML'de devre dışı
        görünür ve hidrasyondan sonra geniş ekranda etkinleşir.
      - `prefersReducedMotion`: sunucu `false` → animasyon açık başlar, tercih
        eden kullanıcıda hidrasyondan sonra kapanır.
  */
  const isWide = useMediaQuery(WIDE_SCREEN_QUERY);
  const prefersReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);

  const active = findLayout(mode);

  /*
    Kapalı düzenlerin gerekçesi TEK KAYNAKTAN gelir (`narrowScreenNote`).
    Düğmedeki `title` ile aşağıdaki görünür metin aynı cümleyi kullanır;
    biri değişip diğeri eskide kalamaz.
  */
  const narrowScreenNotes = LAYOUTS.filter((layout) => isLayoutDisabled(layout, isWide))
    .map((layout) => layout.narrowScreenNote)
    .filter((note): note is string => note !== undefined);

  /*
    AZALTILMIŞ HAREKET: düzen animasyonu kaynağında kapatılır. Kartlar yine
    görünür — yalnız hareket olmadan. "Hareketi azalt" bir içerik gizleme
    tercihi değildir. Gerekçenin tamamı `lib/catalog/layout-modes.ts` içinde.
  */
  const transition = layoutTransition(prefersReducedMotion);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-caption text-text-muted" id={`${groupId}-aciklama`}>
          Görünüm
        </p>

        {/*
          `role="group"` + `aria-labelledby`: üç düğme tek bir kontrol kümesidir.
          Radyo grubu DEĞİL — radyo grubu ok tuşlarıyla gezinme sözleşmesi
          getirir; burada her düğme sıradan bir Tab durağıdır ve seçili olduğu
          `aria-pressed` ile bildirilir (WAI-ARIA "toggle button" deseni).
        */}
        <div
          role="group"
          aria-labelledby={`${groupId}-aciklama`}
          className="flex rounded-md border border-border-strong bg-surface-raised p-0.5"
        >
          {LAYOUTS.map((layout) => {
            const Icon = MODE_ICONS[layout.mode];
            const selected = layout.mode === mode;
            const disabled = isLayoutDisabled(layout, isWide);

            return (
              <button
                key={layout.mode}
                type="button"
                aria-pressed={selected}
                aria-label={layout.ariaLabel}
                /*
                  `aria-disabled` + `title`, yalnız `opacity`/`cursor` DEĞİL:
                  görsel soluklaştırma ekran okuyucuya hiçbir şey anlatmaz.
                  Gerçek `disabled` yerine `aria-disabled` kullanıyoruz ki düğme
                  odak alabilsin ve kullanıcı NEDEN kapalı olduğunu duyabilsin —
                  `disabled` bir düğme Tab sırasından tamamen düşer.
                */
                aria-disabled={disabled || undefined}
                title={disabled ? layout.narrowScreenNote : undefined}
                onClick={() => {
                  if (disabled) return;
                  setMode(layout.mode);
                }}
                className={cn(
                  "relative inline-flex min-h-9 items-center gap-1.5 rounded-[0.3rem] px-3 py-1.5",
                  "text-caption font-semibold",
                  "transition-[color,background-color] duration-(--duration-fast) ease-(--ease-standard)",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                  selected ? "text-text-inverse" : "text-text-muted hover:text-text",
                  disabled && "cursor-not-allowed opacity-55",
                )}
              >
                {/*
                  Seçili göstergesi ayrı bir katman: `layoutId` sayesinde
                  düğmeden düğmeye KAYAR. Zemin marka tokenıyla verilir
                  (`--color-surface-dark`, Gece Laciverti); referans koddaki
                  sabit `bg-gray-900` KULLANILMAZ.
                */}
                {selected && (
                  <motion.span
                    layoutId={`${groupId}-secili`}
                    className="absolute inset-0 rounded-[0.3rem] bg-surface-dark"
                    transition={transition}
                    aria-hidden="true"
                  />
                )}
                <Icon className="relative size-4" aria-hidden="true" />
                <span className="relative hidden sm:inline">{layout.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/*
        Dar ekranda dört sütunun neden kapalı olduğu GÖRÜNÜR metinle de
        söylenir — `title` yalnız fareyle üzerine gelince okunur, dokunmatik
        ekranda hiç görünmez.
      */}
      {!isWide && narrowScreenNotes.length > 0 && (
        <p className="text-caption text-text-muted">{narrowScreenNotes.join(" ")}</p>
      )}

      <LayoutGroup>
        <motion.ul layout={!prefersReducedMotion} className={active.containerClassName}>
          {products.map((product, index) => (
            <motion.li
              key={product.id}
              layout={!prefersReducedMotion}
              transition={transition}
              className="flex"
            >
              <ProductCard
                product={product}
                priority={index < priorityCount}
                layout={active.mode === "list" ? "list" : "grid"}
                sizes={active.imageSizes}
              />
            </motion.li>
          ))}
        </motion.ul>
      </LayoutGroup>
    </div>
  );
}
