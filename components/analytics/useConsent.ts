"use client";

import { useSyncExternalStore } from "react";
import {
  clearStoredConsent,
  getConsentServerSnapshot,
  getConsentSnapshot,
  storeConsent,
  subscribeConsent,
  type ConsentChoice,
  type ConsentState,
} from "@/lib/analytics/consent";

/*
  ============================================================================
  ÇEREZ ONAYININ REACT BAĞLANTISI.
  ============================================================================

  Kalıcılık `lib/analytics/consent.ts` içindedir; burada yalnız React'e
  bağlanır ve iki ek işaret üretilir.

  NEDEN CONTEXT YOK. Onay kararı React'in DIŞINDA yaşar (`localStorage`).
  Bir sağlayıcı kurmak, kararı okumak için tüm site kabuğunu istemci
  bileşeninin altına sokmayı ve durumu bir efektle React'e taşımayı
  gerektirirdi. `useSyncExternalStore` bu iş için vardır: bant, yükleyici ve
  alt bilgideki tercih butonu depoyu birbirinden bağımsız okur, hepsi aynı
  anda güncellenir, aralarında ortak bir ata gerekmez.

  1) `hydrated` — SUNUCU ANLIK GÖRÜNTÜSÜ ZORUNLU OLARAK "sorulmadı"dır, çünkü
  sunucu `localStorage`i göremez. Yalnız duruma baksaydık kararını çoktan
  vermiş kullanıcıya gönderilen HTML bandı İÇERİRDİ ve bant hidrasyondan
  sonra kaybolurdu — her sayfa açılışında bir yanıp sönme. `hydrated` ayrı bir
  `useSyncExternalStore` ile üretilir: sunucuda `false`, istemcide `true`.
  Bant `false` iken hiç render edilmez, dolayısıyla HTML'de de yoktur.

  2) `reopened` — bandın KENDİLİĞİNDEN mi yoksa alt bilgideki butona basılarak
  mı açıldığını ayırır; bant odağı yalnız ikinci durumda üstlenir.
*/

export interface ConsentSnapshot {
  /** Kullanıcının kararı. `unknown` = henüz sorulmadı ya da sıfırlandı. */
  state: ConsentState;
  /** İstemcide miyiz? `false` iken hiçbir onay arayüzü render edilmez. */
  hydrated: boolean;
  /** Bant alt bilgiden AÇIKÇA yeniden istendi mi? Odak yönetimi buna bakar. */
  reopened: boolean;
}

// ---------------------------------------------------------------------------
// Hidrasyon işareti
// ---------------------------------------------------------------------------

/*
  Aboneliği YOK: bu değer bir kez değişir (sunucu → istemci) ve bu değişimi
  `useSyncExternalStore`un kendi montaj kontrolü zaten yakalar. Referansı
  kararlı olsun diye modül seviyesinde durur.
*/
const subscribeNothing = () => () => {};
const alwaysHydrated = () => true;
const neverHydrated = () => false;

// ---------------------------------------------------------------------------
// "Yeniden açıldı" işareti
// ---------------------------------------------------------------------------

let reopenedFlag = false;
const reopenListeners = new Set<() => void>();

function subscribeReopened(listener: () => void): () => void {
  reopenListeners.add(listener);
  return () => {
    reopenListeners.delete(listener);
  };
}

function getReopened(): boolean {
  return reopenedFlag;
}

function getReopenedServerSnapshot(): boolean {
  return false;
}

function setReopened(value: boolean): void {
  if (reopenedFlag === value) return;
  reopenedFlag = value;
  for (const listener of reopenListeners) listener();
}

// ---------------------------------------------------------------------------
// Eylemler
// ---------------------------------------------------------------------------

/** Kararı kalıcı olarak yazar; bandı kapatır. */
export function setConsent(choice: ConsentChoice): void {
  storeConsent(choice);
  setReopened(false);
}

/**
 * Kararı sıfırlar ve bandı yeniden açar.
 *
 * ONAY GERİ ALINABİLİR OLMAK ZORUNDA: vermek bir tıkla mümkünse geri almak da
 * aynı kolaylıkta olmalıdır.
 */
export function reopenConsent(): void {
  clearStoredConsent();
  setReopened(true);
}

// ---------------------------------------------------------------------------
// Kanca
// ---------------------------------------------------------------------------

/** Onay durumunu okur. Karar değişince bileşen yeniden render edilir. */
export function useConsent(): ConsentSnapshot {
  const state = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getConsentServerSnapshot,
  );
  const hydrated = useSyncExternalStore(subscribeNothing, alwaysHydrated, neverHydrated);
  const reopened = useSyncExternalStore(subscribeReopened, getReopened, getReopenedServerSnapshot);

  return { state, hydrated, reopened };
}
