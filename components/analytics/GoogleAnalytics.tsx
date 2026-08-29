"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackPageView } from "@/lib/analytics/events";
import { useConsent } from "@/components/analytics/useConsent";

/*
  ============================================================================
  GA4 YÜKLEYİCİSİ — gtag.js yalnız ONAY VERİLDİKTEN SONRA yüklenir.
  ============================================================================

  ONAY VERİLMEDİYSE HİÇBİR İSTEK ÇIKMAZ. `googletagmanager.com`a bağlanmak bile
  IP adresini ve User-Agent'ı Google'a taşır; bu yüzden "yükle ama çerez yazma"
  yaklaşımı KVKK açısından yetersizdir. Script etiketi `granted` olmadan hiç
  render edilmez.

  ONAY MODU (Consent Mode v2) YİNE DE KURULUR. Onay verildikten sonra bile
  varsayılanlar önce TAMAMI REDDEDİLMİŞ olarak tanımlanır, ardından yalnız
  `analytics_storage` "granted"a çekilir. Böylece reklam depolama izinleri
  (`ad_storage`, `ad_user_data`, `ad_personalization`) açık kalmaz — bu site
  reklam ölçümü yapmıyor ve onay metni de reklam için onay istemiyor.
  Onayın kapsamı ile teknik ayarın kapsamı birebir aynı olmalıdır.

  `gtag` KABUĞUNU BİZ TANIMLARIZ, satır içi script değil. Sebep bir yarış
  durumu: satır içi `<Script>` de hidrasyondan sonra enjekte edilir, yani
  aşağıdaki `page_view` efekti ondan ÖNCE çalışabilir ve ilk sayfa görüntüleme
  sessizce kaybolurdu. Kabuk bir efektte tanımlandığında sıra garanti altındadır
  ve `gtag()` çağrıları `dataLayer` kuyruğuna yazılır; kütüphane yüklendiğinde
  kuyruğu baştan işler. Resmî snippet'in çalışma biçimi zaten budur.

  `send_page_view: false` BİLİNÇLİ. GA4'ün kendi otomatik sayfa görüntülemesi
  ilk yüklemede bir kez çalışır; App Router'daki istemci tarafı gezinmeleri
  (`/urunler` → `/urunler/xyz`) tam bir belge yüklemesi OLMADIĞI için ölçüme
  girmez. Otomatik gönderimi kapatıp her gezinmeyi kendimiz göndermek, hem
  eksik hem çift sayımı aynı anda çözer.
*/

interface GoogleAnalyticsProps {
  /** Doğrulanmış GA4 ölçüm kimliği (`lib/analytics/config.ts`). */
  measurementId: string;
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const consent = useConsent();
  const granted = consent.state === "granted";

  const pathname = usePathname();
  const searchParams = useSearchParams();

  /*
    Kurulum yalnız BİR KEZ çalışır. `granted` bağımlılığı yüzünden efekt onay
    değiştiğinde yeniden koşar; `ref` olmasaydı ikinci bir `config` çağrısı
    gider ve GA4 oturumu ikinci kez başlatırdı.
  */
  const initialized = useRef(false);

  useEffect(() => {
    if (!granted || initialized.current) return;
    initialized.current = true;

    window.dataLayer = window.dataLayer ?? [];

    /*
      `arguments` NESNESİNİN KENDİSİ gönderilir ve BU DEĞİŞTİRİLEMEZ. gtag.js
      `dataLayer` kuyruğunu işlerken her girdinin `[object Arguments]` olup
      olmadığına bakar; yerine düz bir dizi (`push(args)`) yazılırsa girdi bir
      komut değil veri sayılır ve SESSİZCE yok sayılır — hata çıkmaz, yalnız
      ölçüm hiç başlamaz. Resmî snippet'in `arguments` kullanmasının sebebi de
      budur. Dolayısıyla `prefer-rest-params` burada bilinçli olarak kapatılır.

      `...args` parametresi yalnız TİP İÇİNDİR, gövdede kullanılmaz: imzasız bir
      `function gtag()` TypeScript'e "sıfır argüman alır" der ve aşağıdaki her
      çağrı TS2554 ile düşer.
    */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function gtag(...args: unknown[]) {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer?.push(arguments);
    }
    window.gtag = gtag;

    gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
    gtag("js", new Date());
    gtag("config", measurementId, { send_page_view: false });
    // Kullanıcının verdiği onayın tam kapsamı: yalnız analitik.
    gtag("consent", "update", { analytics_storage: "granted" });
  }, [granted, measurementId]);

  /*
    Her gezinmede bir `page_view`. Sorgu dizesi yola DÂHİL EDİLİR: katalog
    filtreleri (`/urunler?marka=…`) yalnız sorguyu değiştirir ve dâhil
    edilmezse tüm filtre kullanımı tek bir sayfa gibi görünürdü.
  */
  useEffect(() => {
    if (!granted) return;
    const query = searchParams.toString();
    trackPageView(query ? `${pathname}?${query}` : pathname);
  }, [granted, pathname, searchParams]);

  if (!granted) return null;

  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      strategy="afterInteractive"
    />
  );
}
