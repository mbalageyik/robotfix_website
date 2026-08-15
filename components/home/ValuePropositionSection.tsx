import { Card } from "@/components/ui/Card";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/home/SectionHeading";
import { cn } from "@/lib/cn";
import { VALUE_PROPOSITION } from "@/lib/home/content";

/*
  Değer önerisi (bilgi dosyası §2, §13/2).

  Metin `lib/home/content.ts` içindedir; burada yalnız yerleşim vardır.
  Üç sütun bir "özellik listesi" değil, konumlandırmanın üç ayağıdır —
  sayı, oran veya süre iddiası taşımaz.

  TAŞIYICI AYAK (Faz 7): üç sütun eşit ağırlıktayken §22'nin 1. maddesi
  ("yalnızca yedek parça mağazası olarak değil...") görsel olarak
  duyulmuyordu — teknik servis, iletişim kanalıyla aynı boydaydı. `lead`
  işaretli ayak dar ekranda İLKTİR, başlığı bir kademe büyüktür ve üstünde
  bir vurgu çizgisi taşır.

  IZGARA 4 SÜTUNDAN 3'E GERİ ALINDI (Faz 8 — ölçülerek). Taşıyıcı ayağa iki
  sütun vermek onu büyütmüyor, DİĞER İKİSİNİ EZİYORDU: 1440px'te kalan
  sütunlar ~215px'e düşüyor, "Doğru parça yönlendirmesi" başlığı iki satıra
  kırılıyor ve gövdesi yedi satırlık dar, tırtıklı bir sütuna dönüşüyordu.
  Taşıyıcı ayak ise iki sütunu dolduramayıp altında büyük bir boşluk
  bırakıyordu. Üç eşit sütunda her kart ~380px olur; vurgu tipografi ve
  çizgiyle korunur, kimse ezilmez.

  AYRIM YALNIZ RENKLE ANLATILMAZ (CLAUDE.md): fark aynı anda sıra, başlık
  kademesi ve gövde kademesi farkıdır; vurgu çizgisi bunların üstüne binen
  dördüncü işarettir. Kaybolan bir bilgi yoktur — üç ayağın metni de tam
  hâliyle okunur.
*/

export function ValuePropositionSection() {
  return (
    <Section id="hakkinda" labelledBy="deger-onerisi-baslik">
      <SectionHeading
        id="deger-onerisi-baslik"
        overline={VALUE_PROPOSITION.overline}
        title={VALUE_PROPOSITION.title}
        description={VALUE_PROPOSITION.body}
      />

      <ul className="mt-(--spacing-heading-gap) grid gap-5 md:grid-cols-3">
        {VALUE_PROPOSITION.pillars.map((pillar) => (
          <li key={pillar.title} className="flex">
            {/*
              Taşıyıcı ayak `raised` (e2) taşır, diğerleri `default` (e1):
              yükselti kademesi hiyerarşiyi anlatan beşinci işarettir ve
              tipografiyle aynı yönü gösterir.
            */}
            <Card
              variant={pillar.lead ? "raised" : "default"}
              className="flex w-full flex-col gap-2"
            >
              {pillar.lead && (
                /* Dekoratif vurgu çizgisi — tek başına anlam taşımaz. */
                <span aria-hidden="true" className="mb-1 block h-1 w-12 rounded-full bg-link" />
              )}
              <h3 className={pillar.lead ? "text-h3" : "text-h4"}>{pillar.title}</h3>
              <p className={cn("text-text-muted", pillar.lead ? "text-body-lg" : "text-body")}>
                {pillar.body}
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}
