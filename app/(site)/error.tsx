"use client";

import { useEffect } from "react";
import { Container } from "@/components/layout/Container";
import { ErrorState } from "@/components/ui/ErrorState";

/*
  ============================================================================
  GENEL SİTE HATA SINIRI.
  ============================================================================

  NE ZAMAN DEVREYE GİRER. `(site)` altındaki bir sayfa render sırasında hata
  FIRLATIRSA. Bu grubun en belirgin kullanıcısı ürün detay sayfasıdır: veri
  kaynağına ulaşılamadığında artık `notFound()` çağırmaz, hata fırlatır —
  çünkü geçici bir arıza "bu ürün yok" (404) demek değildir. Ayrımın gerekçesi
  `app/(site)/urunler/[slug]/page.tsx` içinde yazılıdır.

  NEDEN ÖNEMLİ. Bu dosya olmasaydı fırlatılan hata Next'in genel hata ekranına
  düşerdi: markasız, Türkçesiz, kurtarma yolu olmayan bir sayfa. Durum kodu
  yine 500 olurdu ama kullanıcı ne olduğunu anlamazdı.

  SINIRI. Hata sınırı bir İSTEMCİ bileşenidir ve yalnız `children`'ı sarar;
  `layout.tsx` (başlık/alt bilgi) ayakta kalır. Yani gezinme çalışmaya devam
  eder, kullanıcı siteden kopmaz.

  NE YAZMAZ. `error.message` KULLANICIYA GÖSTERİLMEZ. Üretimde Next zaten
  mesajı temizler, ama burada bilinçli olarak da yazmayız: sorgu metni,
  tablo adı veya bağlantı hedefi içerebilir. Teşhis için `digest` yeterlidir
  ve sunucu günlüğüyle eşleşir.
*/

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[site] sayfa render edilemedi:", error.digest ?? error.message);
  }, [error]);

  return (
    <main id="icerik" tabIndex={-1} className="flex-1">
      <Container width="narrow" className="py-16">
        <h1 className="text-h1">Sayfa şu anda görüntülenemiyor</h1>
        <p className="mt-3 max-w-prose text-body-lg text-text-muted">
          Geçici bir aksaklık oldu; içeriğe ulaşamadık. Bu ürünün veya sayfanın kaldırıldığı
          anlamına gelmez.
        </p>

        <ErrorState
          live
          className="mt-6"
          title="Tekrar denemeyi öneririz"
          description="Sorun birkaç dakika içinde geçmezse WhatsApp üzerinden yazabilirsiniz; aradığınız parçayı birlikte bulalım."
          action={
            <button
              type="button"
              onClick={reset}
              className="text-body font-semibold text-link underline underline-offset-4 hover:text-link-hover"
            >
              Yeniden dene
            </button>
          }
        />

        {error.digest && (
          <p className="mt-6 font-mono text-caption text-text-disabled">
            Hata kodu: {error.digest}
          </p>
        )}
      </Container>
    </main>
  );
}
