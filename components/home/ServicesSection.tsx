import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/home/SectionHeading";
import { ServicePanels, type ServicePanelItem } from "@/components/home/ServicePanels";
import { getServiceImage } from "@/lib/home/service-media";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { whatsappCtaLabels } from "@/lib/site-config";
import type { DataResult } from "@/lib/data/result";
import type { ServiceRow } from "@/lib/data/types";

/*
  Teknik servis hizmetleri (bilgi dosyası §5, §13/6).

  SUNUM: hizmetler yatayda genişleyen panel şeridinde gösterilir
  (`ServicePanels`, istemci bileşeni). VERİ VE GÖRÜNÜRLÜK DESENİ DEĞİŞMEDİ:
  satırlar yine `listServices()` ile gelir, sorguda `status` filtresi
  yazılmaz, görünürlüğü RLS belirler.

  BU DOSYA NEDEN SUNUCUDA KALDI:
  `WhatsAppButton` numarayı site ayarlarından okuyan ASENKRON bir sunucu
  bileşenidir; bir istemci bileşeninin içinde oluşturulamaz. Bu yüzden her
  panelin CTA'sı BURADA üretilir ve hazır bir düğüm olarak şeride geçirilir.
  Yan kazanç: CTA'lar ve hizmet adları istemci paketine girmeden sunucu
  HTML'inde yer alır — JS yüklenmese de hizmetler okunur ve WhatsApp'a
  ulaşılır (bilgi dosyası §14).

  HİZMET DETAY SAYFASI YOK: bu yüzden CTA var olmayan bir sayfaya değil,
  WhatsApp servis şablonuna gider (`lib/whatsapp.ts`).

  VERİ YOKSA BÖLÜM RENDER EDİLMEZ — Faz 5'teki davranış korunur. Hizmet
  başlıkları koda gömülmez; hizmet kapsamı işletmenin yönettiği bir veridir.
*/

export function ServicesSection({ result }: { result: DataResult<ServiceRow[]> }) {
  if (!result.ok || result.data.length === 0) return null;

  const items: ServicePanelItem[] = result.data.map((service) => ({
    id: service.id,
    name: service.name,
    description: service.short_description,
    iconKey: service.icon_key,
    /*
      Panel zemini fotoğrafı. Eşleme `icon_key` üzerinden yapılır ve
      bulunamazsa `null` döner — hizmet yine listelenir, paneli degrade +
      simge zemininde durur. Görsellerin YER TUTUCU olduğu ve neden şemada
      değil kodda tutulduğu `lib/home/service-media.ts` başında yazılıdır.
    */
    image: getServiceImage(service.icon_key),
    /*
      Mesaj gövdesi ORTAK şablondan gelir ve hizmete göre uydurulmaz.
      `buildServiceMessage` marka/model ve sorun alanlarını müşterinin
      doldurması için yer tutucuyla bırakır; hizmet adını "yaşadığım sorun"
      diye yazmak (ör. "Periyodik Bakım") yanlış bir cümle kurardı.
    */
    cta: (
      <WhatsAppButton
        intent="service"
        label="WhatsApp’tan Sor"
        size="sm"
        event="whatsapp_service_panel_click"
      />
    ),
  }));

  return (
    <Section id="hizmetler" labelledBy="hizmetler-baslik" width="wide">
      <SectionHeading
        id="hizmetler-baslik"
        overline="Teknik servis"
        title="Robot süpürgeler için servis hizmetleri"
        description="Cihazınızda hangi işlem gerektiğinden emin değilseniz, arızayı yazmanız yeterli."
      />

      <ServicePanels items={items} />

      {/*
        Şeridin altındaki genel çıkış: panel seçiminden bağımsız, sabit
        konumlu bir servis talebi yolu. Panel CTA'sı seçilen hizmetin
        bağlamında, bu ise "hangisi olduğundan emin değilim" durumundadır.
      */}
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
