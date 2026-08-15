import { Card } from "@/components/ui/Card";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/home/SectionHeading";
import { ClockIcon, MapPinIcon } from "@/components/ui/icons";
import type { ResolvedSiteConfig } from "@/lib/site-config";

/*
  Güven unsurları (bilgi dosyası §13/10).

  BURADA NE YOK, ONU BİLMEK ÖNEMLİ:
  - sayısal başarı iddiası yok ("500'den fazla tamir", "%95 memnuniyet",
    "1 gün teslimat" — §10'da bunlar doğrulanmadan kullanılamaz der),
  - müşteri yorumu / puan yok (doğrulanmış müşteri kanıtımız yok, §20),
  - sertifika, rozet, yetkili servis ifadesi yok (§10).

  Geriye YALNIZ doğrulanabilir, işletmenin kendi girdiği statik bilgi kalır:
  fiziksel adres ve çalışma saatleri. İkisi de `site_settings` üzerinden
  gelir; kodda sabit değildir.

  HİÇBİRİ GİRİLMEMİŞSE BÖLÜM HİÇ RENDER EDİLMEZ. Boş bir "güven" bölümü
  göstermek, güven vermeyen tek şeydir; yer tutucu adres uydurmak ise §20
  ihlalidir.
*/

export function TrustSection({ siteConfig }: { siteConfig: ResolvedSiteConfig }) {
  const { addressLine, workingHours } = siteConfig;

  if (!addressLine && !workingHours) return null;

  return (
    <Section id="guven" labelledBy="guven-baslik">
      <SectionHeading
        id="guven-baslik"
        overline="İşletme bilgileri"
        title="Fiziksel adresi olan bir işletme"
        description="Cihazınızı teslim edebileceğiniz gerçek bir işletme adresi ve çalışma saatleri."
      />

      <div className="mt-(--spacing-heading-gap) grid gap-5 sm:grid-cols-2">
        {addressLine && (
          <Card className="flex flex-col gap-2">
            <MapPinIcon className="size-6 text-link" />
            <h3 className="text-h4">Adres</h3>
            <address className="text-body not-italic text-text-muted">{addressLine}</address>
          </Card>
        )}

        {workingHours && (
          <Card className="flex flex-col gap-2">
            <ClockIcon className="size-6 text-link" />
            <h3 className="text-h4">Çalışma saatleri</h3>
            <p className="text-body text-text-muted">{workingHours}</p>
          </Card>
        )}
      </div>
    </Section>
  );
}
