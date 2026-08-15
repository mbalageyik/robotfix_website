import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/home/SectionHeading";
import { MARKETPLACE_CONTENT } from "@/lib/home/content";
import type { ResolvedSiteConfig } from "@/lib/site-config";

/*
  Pazaryeri satış kanalları (bilgi dosyası §9, §13/9).

  KURAL: bağlantı yoksa buton HİÇ gösterilmez (§9, CLAUDE.md). Kodda sabit
  mağaza URL'i YOKTUR — bağlantılar yalnız `site_settings` üzerinden gelir
  (`getSiteConfig().storeLinks`). Ayar girilmemişse bölüm nötr bir bilgi
  cümlesiyle kalır; sahte veya "yakında" görünümlü tıklanabilir bir bağlantı
  üretilmez.

  Bu bölüm MAĞAZA yönlendirmesidir, ürün bazlı değildir: ürün bazlı
  bağlantılar ürün detay sayfasında yaşar.

  §9 gereği fiyat/stok senkronizasyonu izlenimi verilmez — sorumluluk
  cümlesi bölümün ayrılmaz parçasıdır.
*/

export function MarketplaceSection({ siteConfig }: { siteConfig: ResolvedSiteConfig }) {
  const { storeLinks } = siteConfig;

  return (
    <Section id="pazaryerleri" labelledBy="pazaryerleri-baslik" surface="raised">
      <SectionHeading
        id="pazaryerleri-baslik"
        overline={MARKETPLACE_CONTENT.overline}
        title={MARKETPLACE_CONTENT.title}
        description={MARKETPLACE_CONTENT.body}
      />

      {storeLinks.length > 0 ? (
        <ul className="mt-8 flex flex-wrap gap-3">
          {storeLinks.map((link) => (
            <li key={link.marketplace}>
              {/*
                Pazaryerinin adı buton metninde AÇIKÇA yazar (§9, §15): renk
                veya logo tek gösterge olamaz. `external` yeni sekme + rel
                güvenlik niteliklerini ve ekran okuyucu bilgisini getirir.
              */}
              <ButtonLink
                href={link.url}
                variant="marketplace"
                external
                data-event={`marketplace_store_${link.marketplace}_click`}
              >
                {link.label} mağazamız
              </ButtonLink>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 max-w-2xl text-body text-text-muted">{MARKETPLACE_CONTENT.emptyNote}</p>
      )}

      <p className="mt-6 max-w-2xl text-caption text-text-muted">
        {MARKETPLACE_CONTENT.disclaimer}
      </p>
    </Section>
  );
}
