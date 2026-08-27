import { FeaturedProductPanel } from "@/components/home/FeaturedProductPanel";
import { FeaturedStackStage } from "@/components/home/FeaturedStackStage";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/home/SectionHeading";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { EMPTY_STATES } from "@/lib/home/content";
import { whatsappCtaLabels } from "@/lib/site-config";
import type { DataResult } from "@/lib/data/result";
import type { ProductListItem } from "@/lib/data/types";

/*
  Öne çıkan ürünler — "Robot Fix Seçkisi" (bilgi dosyası §13/3).

  BAŞLIK NEDEN "SEÇKİ": §6 ve §16 ölçülemeyen iddiaları yasaklar. "En Çok
  Satanlar" bir satış verisi iddiasıdır ve bizde böyle bir veri yoktur.
  Seçki ise yöneticinin `is_featured` ile yaptığı bir TERCİHTİR — sayfada
  yazan da tam olarak budur.

  GÖRÜNÜRLÜK: sorgu `status` filtresi yazmaz (`listFeaturedProducts`), taslak
  satırları RLS eler. Şu an tohum verisinin tamamı draft olduğu için bu bölüm
  BOŞ döner; bu bir hata değildir ve öyle sunulmaz.

  ÜÇ AYRI DURUM ayrı ayrı ele alınır:
    - sorgu hatası  → ErrorState (boş sonuçla KARIŞTIRILMAZ)
    - boş sonuç     → EmptyState + WhatsApp çıkışı (sahte ürün kartı YOK)
    - dolu sonuç    → kartlar
*/

export function FeaturedProductsSection({ result }: { result: DataResult<ProductListItem[]> }) {
  return (
    <Section id="secki" labelledBy="secki-baslik" surface="raised" width="wide">
      {/*
        Marka adı BAŞLIKTADIR, üst etikette değil: üst etiket büyütülerek
        basılır ve Türkçe büyütme kuralı "Fix"i "FİX"e çevirir — yasak varyant
        (bkz. `lib/home/content.ts` üst etiket notu).
      */}
      <SectionHeading
        id="secki-baslik"
        overline="Öne çıkan ürünler"
        title="Robot Fix Seçkisi"
        description="Katalogdan seçilerek öne çıkarılan parça ve aksesuarlar."
        action={
          <ButtonLink href="/urunler" variant="secondary">
            Tüm ürünler
          </ButtonLink>
        }
      />

      <div className="mt-(--spacing-heading-gap)">
        {!result.ok ? (
          <ErrorState
            title={EMPTY_STATES.queryFailed.title}
            description={EMPTY_STATES.queryFailed.description}
            action={
              <WhatsAppButton
                intent="service"
                label={whatsappCtaLabels.productInfo}
                event="whatsapp_featured_error_click"
              />
            }
          />
        ) : result.data.length === 0 ? (
          <EmptyState
            title={EMPTY_STATES.featured.title}
            description={EMPTY_STATES.featured.description}
            action={
              <div className="flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/urunler" variant="primary">
                  Ürün kataloğuna git
                </ButtonLink>
                <WhatsAppButton
                  intent="service"
                  label={whatsappCtaLabels.productInfo}
                  event="whatsapp_featured_empty_click"
                />
              </div>
            }
          />
        ) : (
          <FeaturedStackStage
            items={result.data.map((product) => ({
              id: product.id,
              /*
                HİÇBİR KART ÖNCELİK ALMAZ. Buradaki eski not "yalnız ilk
                satırdaki kartlar LCP adayıdır" diyordu; ölçüldüğünde bu
                bölümün TAMAMININ katlanmanın altında olduğu görüldü. O
                öncelik `<head>`e ikinci bir görsel preload'u koyup gerçek
                LCP elemanı olan hero görseliyle yarışıyordu.
              */
              content: <FeaturedProductPanel product={product} />,
            }))}
          />
        )}
      </div>
    </Section>
  );
}
