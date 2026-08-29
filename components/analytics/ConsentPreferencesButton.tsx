"use client";

import { isAnalyticsConfigured } from "@/lib/analytics/config";
import { reopenConsent } from "@/components/analytics/useConsent";

/*
  Alt bilgideki "Çerez tercihleri" bağlantısı.

  ONAY GERİ ALINABİLİR OLMAK ZORUNDA. Onayı vermek bir tıkla mümkünse geri
  almak da aynı kolaylıkta olmalıdır; aksi hâlde verilen onay tek yönlü bir
  kapıya dönüşür. Buton kararı SIFIRLAR ve bandı yeniden açar — kullanıcı hem
  "kabul"den "ret"e, hem tersine geçebilir.

  ANALİTİK YAPILANDIRILMAMIŞSA HİÇ GÖRÜNMEZ. Ölçüm kimliği yokken hiçbir çerez
  yerleştirilmiyor demektir; olmayan bir şey için tercih sunmak kullanıcıyı
  yanıltır. `isAnalyticsConfigured` build sırasında sabite indiği için bu dal
  istemci paketinden tamamen çıkar.
*/

export function ConsentPreferencesButton() {
  if (!isAnalyticsConfigured) return null;

  return (
    <button
      type="button"
      onClick={reopenConsent}
      className="inline-flex min-h-11 items-center text-caption text-text-muted underline underline-offset-4 decoration-1 transition-colors duration-(--duration-fast) hover:text-text hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      Çerez tercihleri
    </button>
  );
}
