import { Suspense } from "react";
import { gaMeasurementId } from "@/lib/analytics/config";
import { CookieConsentBanner } from "@/components/analytics/CookieConsentBanner";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";

/*
  ============================================================================
  ANALİTİK KATMANININ TEK MONTAJ NOKTASI (sunucu bileşeni).
  ============================================================================

  YAPILANDIRILMAMIŞSA HİÇBİR ŞEY EKLENMEZ. Ölçüm kimliği yokken ne bant, ne
  script render edilir; istemci paketine tek satır analitik kodu girmez ve alt
  bilgideki "Çerez tercihleri" butonu da kendiliğinden kaybolur. Bu,
  ".env.example → boş bırakılırsa analytics YÜKLENMEZ" sözünün koddaki
  karşılığıdır.

  `Suspense` ZORUNLU, süsleme değil. `GoogleAnalytics` içindeki
  `useSearchParams()` sunucuda çözülemez; sınırsız kullanıldığında Next.js onu
  kapsayan TÜM sayfayı statik üretimden çıkarır (build hatası:
  "missing-suspense-with-csr-bailout"). Sınır, dinamikliği yalnız bu görünmez
  bileşene hapseder; sayfalar statik kalır.

  BANT SINIRIN DIŞINDA. Sorgu parametresini o okumuyor; gereksiz yere askıya
  alınmamalı ki karar arayüzü ilk boyamada hazır olsun.
*/

export function Analytics() {
  if (gaMeasurementId === null) return null;

  return (
    <>
      <Suspense fallback={null}>
        <GoogleAnalytics measurementId={gaMeasurementId} />
      </Suspense>
      <CookieConsentBanner />
    </>
  );
}
