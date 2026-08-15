import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/home/SectionHeading";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { COMPATIBILITY_CONTENT } from "@/lib/home/content";
import { whatsappCtaLabels } from "@/lib/site-config";

/*
  Uyumluluk anlatımı (bilgi dosyası §13/7).

  Bu bölüm VERİ GÖSTERMEZ: hangi parçanın hangi modele uyduğu ürün
  sayfasının işidir. Burada anlatılan, kullanıcının o bilgiye nasıl
  ulaşacağıdır — katalog filtresi ve WhatsApp çıkışı.

  Hiçbir uyumluluk iddiası yazılmaz (§20): "tüm modellere uyar" gibi bir
  cümle bu sayfada bulunamaz.
*/

export function CompatibilitySection() {
  return (
    <Section id="uyumluluk" labelledBy="uyumluluk-baslik">
      <Card padding="lg" className="flex flex-col gap-6">
        <SectionHeading
          id="uyumluluk-baslik"
          overline={COMPATIBILITY_CONTENT.overline}
          title={COMPATIBILITY_CONTENT.title}
          description={COMPATIBILITY_CONTENT.body}
        />

        <p className="max-w-2xl text-body text-text-muted">{COMPATIBILITY_CONTENT.note}</p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/urunler" variant="primary">
            Katalogda filtrele
          </ButtonLink>
          <WhatsAppButton
            intent="service"
            label={whatsappCtaLabels.productInfo}
            event="whatsapp_compatibility_click"
          />
        </div>
      </Card>
    </Section>
  );
}
