"use client";

import { useCallback, useSyncExternalStore } from "react";

/*
  "Veri tasarrufu" tercihi (`Save-Data`).

  Bilgi dosyası §14: "Mobil ve düşük güçlü cihazlar için daha hafif alternatif
  sunulmalıdır." Bunu CİHAZI TAHMİN EDEREK değil, kullanıcının kendi
  söylediğini dinleyerek yapıyoruz: tarayıcı ayarında veri tasarrufu açıksa
  arka plan videosu hiç yüklenmez, yerinde statik görsel kalır.

  Neden `hardwareConcurrency` / `deviceMemory` ile "güç tahmini" YAPILMIYOR:
  o değerler cihaz parmak izi yüzeyidir, tarayıcılar giderek kısıtlar ve
  yanlış tahmin kullanıcıyı sessizce daha kötü bir deneyime düşürür.
  `saveData` ise açık bir TERCİHTİR — tartışmasızdır.

  Ekran genişliği ayrı bir kapıdır (`useMediaQuery`); bu ikisi VE'lenir.
*/

/**
 * `navigator.connection` lib.dom içinde tanımlı değildir (Network Information
 * API hâlâ taslak ve Safari'de yok). Kullandığımız kadarını burada tarif
 * ediyoruz; hepsi isteğe bağlı, çünkü hiçbiri garanti değil.
 */
interface NetworkInformationLike extends EventTarget {
  saveData?: boolean;
}

function connection(): NetworkInformationLike | undefined {
  return (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
}

/**
 * Kullanıcı veri tasarrufu istiyor mu.
 *
 * API'yi desteklemeyen tarayıcıda ve sunucuda `false` döner — yani "tasarruf
 * istenmiyor". Varsayılanın bu yönde olması gerekir: destek yokluğu bir
 * tercih değildir ve herkesi statik görsele düşürmek yanlış olurdu.
 */
export function useSaveData(): boolean {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const conn = connection();
    conn?.addEventListener("change", onStoreChange);
    return () => conn?.removeEventListener("change", onStoreChange);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => connection()?.saveData === true,
    () => false,
  );
}
