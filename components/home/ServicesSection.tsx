import { Card } from "@/components/ui/Card";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/home/SectionHeading";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { getServiceIcon } from "@/components/ui/icons";
import { whatsappCtaLabels } from "@/lib/site-config";
import type { DataResult } from "@/lib/data/result";
import type { ServiceRow } from "@/lib/data/types";

/*
  Teknik servis hizmetleri (bilgi dosyası §5, §13/6).

  Hizmet DETAY sayfası henüz yoktur; bu yüzden kartlar BAĞLANTI TAŞIMAZ.
  Var olmayan bir sayfaya link vermektense kartı bağlantısız bırakmak
  doğrudur; bölümün sonundaki WhatsApp CTA'sı gerçek çıkış yoludur.

  Simge `services.icon_key` üzerinden gelir ve yalnız tanınan anahtarlarda
  gösterilir. Simge tek gösterge değildir: hizmet adı her zaman metindir.

  VERİ YOKSA BÖLÜM RENDER EDİLMEZ — hizmet başlıkları koda gömülmez, çünkü
  hizmet kapsamı işletme tarafından yönetilen bir veridir.
*/

export function ServicesSection({ result }: { result: DataResult<ServiceRow[]> }) {
  if (!result.ok || result.data.length === 0) return null;

  return (
    <Section id="hizmetler" labelledBy="hizmetler-baslik" width="wide">
      <SectionHeading
        id="hizmetler-baslik"
        overline="Teknik servis"
        title="Robot süpürgeler için servis hizmetleri"
        description="Cihazınızda hangi işlem gerektiğinden emin değilseniz, arızayı yazmanız yeterli."
      />

      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {result.data.map((service) => {
          const ServiceIcon = getServiceIcon(service.icon_key);

          return (
            <li key={service.id} className="flex">
              <Card className="flex w-full flex-col gap-3">
                {ServiceIcon && <ServiceIcon className="size-7 text-link" />}
                <h3 className="text-h4">{service.name}</h3>
                {service.short_description && (
                  <p className="text-body text-text-muted">{service.short_description}</p>
                )}
              </Card>
            </li>
          );
        })}
      </ul>

      <div className="mt-8">
        <WhatsAppButton
          intent="service"
          label={whatsappCtaLabels.service}
          size="lg"
          event="whatsapp_services_click"
        />
      </div>
    </Section>
  );
}
