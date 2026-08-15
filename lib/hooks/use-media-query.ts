"use client";

import { useCallback, useSyncExternalStore } from "react";

/*
  Medya sorgusu okuyucusu — HİDRASYON GÜVENLİ.

  Faz 6'da `HeroScrollStage` içinde yazıldı; Faz 7'de servis vitrini de aynı
  ihtiyacı duyunca buraya taşındı. Mantık DEĞİŞMEDİ, yalnız tek kaynağa alındı.

  NEDEN `useState` + `useEffect` DEĞİL:
  Sunucu medya sorgusunu bilemez. Değeri bir efektle sonradan yazmak iki sorun
  doğurur — React 19'un `set-state-in-effect` kuralı bunu reddeder ve ilk
  istemci render'ı sunucununkiyle çelişirse React öznitelik uyuşmazlığını
  YAMALAMAZ (sessizce yanlış stille kalır).

  `useSyncExternalStore` tam bu iş için vardır: `getServerSnapshot` hidrasyon
  boyunca kullanılır (sunucuyla birebir aynı çıktı), hidrasyondan sonra gerçek
  değere geçilir ve sorgu değiştikçe abonelik yeniden render ettirir.
*/

/**
 * Sorgu eşleşiyor mu.
 *
 * SUNUCU ANLIK GÖRÜNTÜSÜ HER ZAMAN `false`'tur ve bu, çağıran tarafın
 * sorusunu nasıl yazdığını belirler: sunucuda üretilmesini İSTEMEDİĞİNİZ
 * durumu sorgunun DOĞRU tarafına koyun.
 *
 * Örnek: servis vitrini videoyu yalnız geniş ekranda yükler ve sorguyu
 * `(min-width: 768px)` diye sorar. Sunucu `false` döndüğü için sunucu
 * HTML'inde `<video>` HİÇ bulunmaz; dar ekran videoyu hidrasyondan önce bile
 * indirmeye başlamaz. Sorgu `(max-width: 767px)` yazılsaydı sunucu "dar değil"
 * varsayar ve videoyu herkese gönderirdi.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener("change", onStoreChange);
      return () => mediaQuery.removeEventListener("change", onStoreChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Azaltılmış hareket tercihi. Tek yerde yazılsın diye sabit. */
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
