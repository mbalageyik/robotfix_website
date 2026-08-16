import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/home/SectionHeading";
import { cn } from "@/lib/cn";
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

  RESMÎ LOGO KULLANILMAZ — ARANDI, BULUNAMADI/YASAKLI (Ağustos 2026).
  Karar §9'a ("logolar ilgili kullanım kuralları gözetilerek kullanılmalıdır")
  dayandırılmadan önce resmî kaynaklar tarandı:

    - AMAZON: marka kullanım politikası bu kullanımı AÇIKÇA yasaklıyor —
      "The Amazon and Smile logos are not permitted in third-party advertising
      by vendors and sellers linking in to Amazon." Bizimki tam olarak budur.
      İzinli "Available at Amazon" rozeti ise Amazon'un marka portalından
      (Brand Registry) alınır — üçüncü bir siteden indirilemez — ve "bu ürün
      Amazon'da mevcuttur" diyen bir BULUNABİLİRLİK İDDİASIDIR (§20).
    - HEPSİBURADA: herkese açık resmî varlık kaynağı bulunamadı; kurumsal site
      (Basın Odası dâhil) 403 döndü, satıcı akademisi giriş duvarının ardında.
      Üçüncü taraf logo bankaları kullanılmadı: bir logoyu rastgele bir siteden
      indirmek kullanım kurallarına uygunluğu KANITLAMAZ.

  Gerekçenin tamamı ve ölçülen kontrast değerleri: `docs/design-decisions.md`
  §38. İşletme resmî varlıkları kendi hesabından temin ederse karar yeniden
  açılabilir — o bir varlık temini ve onay işidir, kodlama işi değil.

  Pazaryeri adı bu yüzden butonda METİN olarak yazar; yanındaki dekoratif çizgi
  yalnız kanalları birbirinden ayırmaya yarar ve tanınmayan bir kanalda hiç
  boyanmaz — kanal YALNIZ RENKLE anlatılmaz (§9, §15).
*/

/**
 * Pazaryeri kimliği → dekoratif vurgu sınıfı.
 *
 * Kimlikler `lib/site-config.ts` içindeki `STORE_LINK_KEYS` ile aynıdır.
 * Listede olmayan bir kimlik nötr bağlantı rengine düşer: uydurma bir marka
 * rengi üretilmez. Renkler resmî marka renkleri değildir (gerekçe:
 * `app/globals.css` içindeki pazaryeri tonları notu).
 */
const ACCENTS: Record<string, string> = {
  amazon: "bg-marketplace-amazon",
  hepsiburada: "bg-marketplace-hepsiburada",
  trendyol: "bg-marketplace-trendyol",
};

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
        <ul className="mt-(--spacing-heading-gap) flex flex-wrap gap-3">
          {storeLinks.map((link) => (
            <li key={link.marketplace}>
              {/*
                Pazaryerinin adı buton metninde AÇIKÇA yazar (§9, §15): renk
                veya logo tek gösterge olamaz. Metin ayrıca bir EYLEM söyler
                ("...git"), yalnız bir ad değildir. `external` yeni sekme +
                `rel="noopener noreferrer"` ve "yeni sekmede açılır" bilgisini
                getirir.
              */}
              <ButtonLink
                href={link.url}
                variant="marketplace"
                external
                data-event={`marketplace_store_${link.marketplace}_click`}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-5 w-1 shrink-0 rounded-full",
                    ACCENTS[link.marketplace] ?? "bg-link",
                  )}
                />
                {link.label} mağazamıza git
              </ButtonLink>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-(--spacing-heading-gap) max-w-2xl text-body text-text-muted">
          {MARKETPLACE_CONTENT.emptyNote}
        </p>
      )}

      <p className="mt-8 max-w-2xl text-caption text-text-muted">
        {MARKETPLACE_CONTENT.disclaimer}
      </p>
    </Section>
  );
}
