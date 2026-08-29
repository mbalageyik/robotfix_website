/*
  ============================================================================
  ÖLÇÜM OLAYLARI — gtag ile konuşulan TEK arayüz.
  ============================================================================

  Bileşenler `window.gtag`i doğrudan ÇAĞIRMAZ. Sebebi tek satırlık bir kolaylık
  değil: olay adı serbest metin olarak yazıldığında `whatsapp_click` ile
  `whatsapp-click` GA4'te İKİ AYRI olay olur ve fark ancak raporda, veriler
  bölünmüşken görülür. Ad kümesini burada tiplemek bu hatayı derleme zamanına
  taşır.

  Olay listesi bilgi dosyası §19'daki "ölçülmesi önerilen dönüşümler"den
  türetilmiştir. GA4'ün ÖNERİLEN adları varsa (`search`, `view_item`) uydurma
  bir ad yerine onlar kullanılır; GA4 bu adları hazır raporlarda tanır.

  ONAY VERİLMEDİYSE HİÇBİR ŞEY OLMAZ. Onay yokken gtag.js hiç yüklenmediği için
  `window.gtag` tanımsızdır ve buradaki her çağrı sessizce düşer. Yani çağrı
  yerlerinin onay durumunu bilmesi ya da kontrol etmesi GEREKMEZ.
*/

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** gtag'e güvenli erişim: yüklenmemişse çağrı yok sayılır. */
function gtag(...args: unknown[]): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag(...args);
}

/**
 * Ölçülen olaylar ve zorunlu parametreleri.
 *
 * Yeni bir olay eklemek, bu tabloya bir satır eklemek demektir — başka hiçbir
 * yerde ad yazılmaz.
 */
export interface AnalyticsEvents {
  /** WhatsApp CTA tıklaması. `source` hangi yüzeyden geldiğini ayırır. */
  whatsapp_click: { source: "floating" | "product" | "service" | "contact" };
  /** Pazaryeri mağaza bağlantısı tıklaması. */
  marketplace_click: { marketplace: string };
  /** Telefon numarası tıklaması. */
  phone_click: Record<string, never>;
  /** Harita / yol tarifi bağlantısı tıklaması. */
  maps_click: Record<string, never>;
  /** Ürün araması — GA4'ün önerilen `search` olayı. */
  search: { search_term: string };
  /** Marka, kategori veya model filtresi kullanımı. */
  filter_use: { filter_type: string; filter_value: string };
  /** Ürün detay görüntüleme — GA4'ün önerilen `view_item` olayı. */
  view_item: { item_id: string; item_name: string };
  /** İletişim veya talep formu gönderimi. */
  form_submit: { form: string };
}

/**
 * Bir dönüşüm olayını GA4'e gönderir.
 *
 * @example trackEvent("whatsapp_click", { source: "product" })
 */
export function trackEvent<Name extends keyof AnalyticsEvents>(
  name: Name,
  params: AnalyticsEvents[Name],
): void {
  gtag("event", name, params);
}

/**
 * Sayfa görüntüleme gönderir.
 *
 * ELLE GÖNDERİLİR ÇÜNKÜ otomatik gönderim `send_page_view: false` ile
 * KAPATILMIŞTIR (gerekçe: `components/analytics/GoogleAnalytics.tsx`).
 *
 * @param path Sorgu dizesi dâhil yol — örn. `/urunler?marka=roborock`.
 */
export function trackPageView(path: string): void {
  gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}
