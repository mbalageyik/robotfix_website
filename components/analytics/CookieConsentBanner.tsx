"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { setConsent, useConsent } from "@/components/analytics/useConsent";

/*
  ============================================================================
  ÇEREZ ONAYI BANDI — analitik çerezi ondan ÖNCE yerleştirilmez.
  ============================================================================

  KİPSİZ (non-modal), ODAK TUZAĞI YOK. Çerez onayı hayati bir karar değil;
  sayfayı kilitleyen bir diyalog kullanıcıyı içeriğe ulaşmadan karar vermeye
  ZORLAR ve bu, "özgür irade ile verilmiş onay" ölçütünü zayıflatır. Bant
  görünür durur, kullanıcı isterse siteyi gezmeye devam eder; karar
  vermediği sürece hiçbir analitik çerez yazılmaz.

  AÇILIŞTA ODAK TAŞINMAZ. Bandın kendine odak çekmesi, sayfayı okumaya
  başlayan ya da atlama bağlantısını kullanan kullanıcının odağını kaçırır.
  Bant DOM'da alt bilgiden sonra durur ve klavyeyle normal sırada erişilir.

  AMA ALT BİLGİDEN YENİDEN AÇILDIĞINDA ODAK TAŞINIR. Orada bant bir eyleme
  verilen YANITTIR: kullanıcı "Çerez tercihleri"ne bastı ve bir şeyin
  açılmasını bekliyor. Odak taşınmasaydı klavye ya da ekran okuyucu kullanıcısı
  için hiçbir şey olmamış gibi görünürdü (WCAG 2.4.3). İki durumu `reopened`
  bayrağı ayırır.

  İKİ SEÇENEK EŞİT AĞIRLIKTA. "Kabul et" büyük ve renkli, "Reddet" soluk bir
  metin bağlantısı olsaydı bu bir karanlık desen olurdu. İkisi de aynı boyutta,
  aynı ağırlıkta dolu butondur; ayrım yalnız renktedir ve renk TEK gösterge
  değildir — metin eylemi açıkça yazar (CLAUDE.md: "Renk tek gösterge olamaz").

  `aria-live` KULLANILMAZ. Bant sayfa yüklenmesiyle birlikte gelir, bir
  eyleme verilen yanıt değildir; canlı bölge olarak duyurulması ekran okuyucu
  kullanıcısının o an okuduğu şeyi kesintiye uğratırdı. Adlandırılmış bir
  `region` olarak işaretlenir ve yer imi listesinde bulunur.
*/

export function CookieConsentBanner() {
  const consent = useConsent();
  const bannerRef = useRef<HTMLElement>(null);

  /*
    Depo okunana kadar HİÇBİR ŞEY render edilmez (`hydrated`). Aksi hâlde
    kararını çoktan vermiş kullanıcı, her sayfa açılışında bandın bir kare
    boyunca belirip kaybolmasını görürdü.
  */
  const visible = consent.hydrated && consent.state === "unknown";

  useEffect(() => {
    if (visible && consent.reopened) bannerRef.current?.focus();
  }, [visible, consent.reopened]);

  if (!visible) return null;

  return (
    <section
      ref={bannerRef}
      // Odak PROGRAMATİK olarak taşınabilsin diye; Tab sırasına GİRMEZ.
      tabIndex={-1}
      aria-labelledby="cerez-onayi-baslik"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface-raised shadow-(--shadow-e3) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-8">
        <div>
          <h2 id="cerez-onayi-baslik" className="text-body font-semibold text-text">
            Çerez tercihiniz
          </h2>
          {/*
            Metin NE ÖLÇÜLDÜĞÜNÜ ve reddetmenin sonucunu açıkça söyler.
            Doğrulanmamış hiçbir iddia içermez (CLAUDE.md doğruluk kuralı):
            yalnız bu kodun gerçekten yaptığı şey yazılıdır.

            TODO(business): ayrıntılı çerez ve gizlilik politikası METNİ
            işletmeden alınacak; geldiğinde buraya o sayfaya bir bağlantı
            eklenir. Doğrulanmamış hukuki metin uydurulmaz, bu yüzden bugün
            bağlantı YOKTUR.
          */}
          <p className="mt-1 text-caption text-text-muted">
            Sitenin nasıl kullanıldığını anlamak için Google Analytics çerezlerini kullanmak
            istiyoruz. Reklam ve profilleme amacıyla çerez kullanılmaz. Reddederseniz hiçbir
            analitik çerez yerleştirilmez; site aynı şekilde çalışmaya devam eder.
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button variant="primary" size="md" onClick={() => setConsent("granted")}>
            Kabul et
          </Button>
          <Button variant="secondary" size="md" onClick={() => setConsent("denied")}>
            Reddet
          </Button>
        </div>
      </div>
    </section>
  );
}
