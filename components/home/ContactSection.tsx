import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/home/SectionHeading";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { ClockIcon, MapPinIcon, PhoneIcon } from "@/components/ui/icons";
import { whatsappCtaLabels } from "@/lib/site-config";
import type { ResolvedSiteConfig } from "@/lib/site-config";

/*
  İletişim, konum ve WhatsApp çağrısı (bilgi dosyası §13/12).

  TÜM İLETİŞİM BİLGİSİ `site_settings` ÜZERİNDEN GELİR. Kodda numara, adres
  veya saat sabitlenmez (CLAUDE.md + `__tests__/source-hygiene.test.ts`
  bunu otomatik doğrular). Girilmemiş alan render EDİLMEZ — boş bir satır
  veya "—" göstermek yerine o kart hiç çıkmaz.

  `tel:` bağlantısı E.164 numaradan kurulur, ekranda ise işletmenin yazdığı
  görünen biçim (`phone_display`) durur. İkisi aynı ayardan gelir; biri
  eksikse bağlantı kurulmaz, metin yine gösterilir.
*/

export function ContactSection({ siteConfig }: { siteConfig: ResolvedSiteConfig }) {
  const { addressLine, workingHours, phoneDisplay, whatsappPhone, mapsUrl } = siteConfig;

  return (
    <Section id="iletisim" labelledBy="iletisim-baslik" surface="dark" width="wide">
      <SectionHeading
        id="iletisim-baslik"
        overline="İletişim"
        title="Cihazınızı yazın, birlikte bakalım"
        description="Marka, model ve yaşadığınız sorunu iletin; uygun çözümü konuşalım."
      />

      <div className="mt-(--spacing-heading-gap) grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <div className="grid gap-5 sm:grid-cols-2">
          {addressLine && (
            <Card className="flex flex-col gap-2">
              <MapPinIcon className="size-6 text-link" />
              <h3 className="text-h4">Adres</h3>
              <address className="text-body not-italic text-text-muted">{addressLine}</address>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-body font-semibold text-link underline underline-offset-4 hover:text-link-hover"
                >
                  Haritada aç
                  <span className="sr-only"> (yeni sekmede açılır)</span>
                </a>
              )}
            </Card>
          )}

          {workingHours && (
            <Card className="flex flex-col gap-2">
              <ClockIcon className="size-6 text-link" />
              <h3 className="text-h4">Çalışma saatleri</h3>
              <p className="text-body text-text-muted">{workingHours}</p>
            </Card>
          )}

          {phoneDisplay && (
            <Card className="flex flex-col gap-2">
              <PhoneIcon className="size-6 text-link" />
              <h3 className="text-h4">Telefon</h3>
              {whatsappPhone ? (
                <a
                  href={`tel:${whatsappPhone}`}
                  className="text-body font-semibold text-link underline underline-offset-4 hover:text-link-hover"
                >
                  {phoneDisplay}
                </a>
              ) : (
                <p className="text-body text-text-muted">{phoneDisplay}</p>
              )}
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-3 self-start">
          <WhatsAppButton
            intent="service"
            label={whatsappCtaLabels.service}
            size="lg"
            event="whatsapp_contact_click"
            fullWidth
          />
          <ButtonLink href="/urunler" variant="secondary" size="lg" fullWidth>
            Ürünleri İncele
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
