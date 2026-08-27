/*
  Katalog görünüm düzenleri — liste / 2 sütun / 4 sütun.

  NEDEN BİLEŞENDE DEĞİL BURADA: bu bir veri tablosudur, işaretleme değil.
  Sınıf adları, `sizes` dizeleri ve erişilebilirlik etiketleri saf veridir ve
  bileşen render etmeden doğrulanabilir. Projenin test kurulumu `node`
  ortamıdır (React render'ı yoktur), bu yüzden test edilebilir olan her şey
  işaretlemeden ayrı tutulur.
*/

/**
 * Dört sütunlu katalog ızgarasının `sizes` değeri.
 *
 * `ProductCard`'ın VARSAYILANI da budur: ürün detayındaki "İlgili ürünler"
 * listesi de aynı 4 sütunlu ızgarayı kullanır, ikisi tek yerden beslenir.
 *
 * ÖLÇÜLDÜ (1710px görünüm alanı, `max-w-7xl` kapsayıcı): kart 289px çiziliyor
 * → 18rem. Önceki 22rem'lik değer gereğinden büyük dosya indiriyordu; uyarı
 * üretmiyordu ama boşuna bant genişliği harcıyordu.
 */
export const CATALOG_GRID_SIZES =
  "(min-width: 1280px) 18rem, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw";

export type LayoutMode = "list" | "grid2" | "grid4";

export interface LayoutConfig {
  mode: LayoutMode;
  /** Geniş ekranda düğmede görünen kısa etiket. */
  label: string;
  /** Ekran okuyucuya okunan tam açıklama — her zaman vardır. */
  ariaLabel: string;
  /** Ürün listesini saran kapsayıcının sınıfları. */
  containerClassName: string;
  /**
   * `next/image` `sizes`.
   *
   * Görselin GERÇEK render genişliğini anlatır; tarayıcı indireceği dosyayı
   * buna bakarak seçer. Üç düzende genişlik çok farklıdır, bu yüzden tek bir
   * sabit değer en az ikisinde yanlış olurdu.
   *
   * Hesap: kapsayıcı `max-w-7xl` (80rem) ve `lg` üstünde 2rem yan boşluk
   * taşır → içerik genişliği en fazla ~76rem.
   */
  imageSizes: string;
  /**
   * Dar ekranda kullanılamayan düzenler için GEREKÇE. `undefined` ise düzen
   * her ekranda açıktır.
   */
  narrowScreenNote?: string;
}

export const LAYOUTS: readonly LayoutConfig[] = [
  {
    mode: "list",
    label: "Liste",
    ariaLabel: "Liste görünümü",
    containerClassName: "flex flex-col gap-3",
    // Sabit küçük resim: 7rem, sm'den sonra 9rem.
    imageSizes: "(min-width: 640px) 9rem, 7rem",
  },
  {
    mode: "grid2",
    label: "2 sütun",
    ariaLabel: "İki sütunlu ızgara görünümü",
    containerClassName: "grid grid-cols-1 gap-5 sm:grid-cols-2",
    // 2 sütun + 1.25rem boşluk → (76 - 1.25) / 2 ≈ 37rem.
    imageSizes: "(min-width: 1280px) 37rem, (min-width: 640px) 46vw, 92vw",
  },
  {
    mode: "grid4",
    label: "4 sütun",
    ariaLabel: "Dört sütunlu ızgara görünümü",
    containerClassName: "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    // Sayfanın entegrasyondan önceki ızgarası — sütun sayıları değişmedi.
    imageSizes: CATALOG_GRID_SIZES,
    narrowScreenNote: "Dört sütunlu görünüm dar ekranda okunaklı olmadığı için kapalıdır.",
  },
] as const;

/**
 * Sunucuda ve ilk hidrasyonda seçili düzen.
 *
 * Sayfanın entegrasyondan ÖNCEKİ ızgarasıyla aynıdır: görünüm değiştirici
 * eklendi diye ilk çıktı değişmez, hidrasyon uyuşmazlığı da doğmaz.
 */
export const DEFAULT_LAYOUT_MODE: LayoutMode = "grid4";

/**
 * Dört sütunun açılabildiği en dar ekran.
 *
 * `sm` (640px) altında dört sütunluk düzen zaten tek sütuna düşer — seçilse
 * bile görsel bir karşılığı olmaz. Hiçbir şeyi değiştirmeyen bir düğme
 * sunmak yerine düğme açıkça devre dışı bırakılır.
 */
export const WIDE_SCREEN_QUERY = "(min-width: 640px)";

export function findLayout(mode: LayoutMode): LayoutConfig {
  const found = LAYOUTS.find((layout) => layout.mode === mode);
  if (!found) throw new Error(`Bilinmeyen düzen: ${mode}`);
  return found;
}

/** Düzen dar ekranda kapalı mı. */
export function isLayoutDisabled(layout: LayoutConfig, isWideScreen: boolean): boolean {
  return layout.narrowScreenNote !== undefined && !isWideScreen;
}

/**
 * Hareket ayarı.
 *
 * AZALTILMIŞ HAREKETTE SÜRE SIFIRDIR — animasyon "hızlanmaz", HİÇ OLMAZ.
 * `app/globals.css` içindeki global `prefers-reduced-motion` kuralı CSS
 * geçişlerini kısar ama framer-motion'ın her karede `transform` yazan düzen
 * animasyonuna ULAŞMAZ; o yüzden kaynağında kapatılır.
 */
export function layoutTransition(prefersReducedMotion: boolean) {
  return prefersReducedMotion
    ? ({ duration: 0 } as const)
    : ({ type: "spring", stiffness: 200, damping: 26 } as const);
}
