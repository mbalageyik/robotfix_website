import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/home/SectionHeading";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { FAQ_ITEMS } from "@/lib/home/content";
import { whatsappCtaLabels } from "@/lib/site-config";

/*
  Sık sorulan sorular — TASLAK (bkz. `lib/home/content.ts`).

  İÇERİK DURUMU: bilgi dosyasında hazır SSS yoktur. Buradaki beş soru-cevap
  doğrulanmamış hiçbir iddia içermeyecek biçimde yazılmıştır (süre, fiyat,
  kargo, yetkili servis taahhüdü yok) ve işletme onayı beklemektedir.
  `HOMEPAGE_SECTIONS` içinde `contentStatus: "draft"` olarak işaretlidir.

  FAQPage JSON-LD ÜRETİLMEZ: yapılandırılmış veri, işletmenin ONAYLADIĞI
  cevabı arama motoruna bildirir; taslak metin o statüyü taşımaz (§18).

  TEKNİK: `<details>/<summary>` kullanılır — açılır davranış tarayıcının
  kendisindedir, istemci JS yüklenmez, klavye ve ekran okuyucu desteği
  yerleşiktir. Cevaplar kapalıyken de DOM'dadır, yani indekslenebilir.
*/

export function FaqSection() {
  return (
    <Section id="sss" labelledBy="sss-baslik" surface="raised">
      <SectionHeading
        id="sss-baslik"
        overline="Sık sorulan sorular"
        title="Merak edilenler"
        description="Sorunuzun cevabı burada yoksa doğrudan yazabilirsiniz."
      />

      <div className="mt-(--spacing-heading-gap) flex flex-col">
        {FAQ_ITEMS.map((item) => (
          <details key={item.question} className="group border-b border-border py-2 first:border-t">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 text-body-lg font-semibold text-text hover:text-link">
              {item.question}
              {/*
                Simge yalnız DESTEKLEYİCİDİR: açık/kapalı durumu `<details>`
                öğesinin kendi semantiğiyle ekran okuyucuya iletilir.
              */}
              <span
                aria-hidden="true"
                className="shrink-0 text-h4 font-normal text-link transition-transform duration-(--duration-fast) ease-(--ease-standard) group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="max-w-2xl pb-4 text-body text-text-muted">{item.answer}</p>
          </details>
        ))}
      </div>

      <div className="mt-8">
        <WhatsAppButton
          intent="service"
          label={whatsappCtaLabels.productInfo}
          event="whatsapp_faq_click"
        />
      </div>
    </Section>
  );
}
