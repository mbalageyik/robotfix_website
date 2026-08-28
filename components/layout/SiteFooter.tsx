import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/layout/Logo";
import { ClockIcon, ExternalLinkIcon, MapPinIcon, PhoneIcon } from "@/components/ui/icons";
import { getSiteConfig } from "@/lib/site-config";

/*
  ============================================================================
  GENEL SİTE ALT BİLGİSİ — sunucu bileşeni.
  ============================================================================

  BOŞ ALAN GÖSTERİLMEZ, UYDURULMAZ. Adres, çalışma saati, telefon ve harita
  bağlantısı `site_settings` tablosundan gelir ve bugün hepsi boştur
  (bilgi dosyası §20, §21: işletme bilgisi doğrulanmadan yayımlanmaz). Bu
  yüzden her satır kendi verisi varsa render edilir; "Adres: —" gibi bir
  yer tutucu satır YAZILMAZ. İşletme panelden bilgiyi girdiği anda satır
  kendiliğinden belirir.

  Aynı sebeple alt bilgide "7/24 destek", "hızlı kargo", "yetkili servis"
  gibi hiçbir iddia yoktur — bunların hiçbiri doğrulanmadı (§20).

  Pazaryeri bağlantıları da aynı kuralla: `storeLinks` yalnız doğrulanmış
  MAĞAZA bağlantılarını taşır, boşsa o blok hiç görünmez.
*/

/** Menüdekiyle aynı gerçek rotalar; çapa verilmez — alt bilgi her sayfada durur. */
const FOOTER_LINKS = [
  { href: "/urunler", label: "Ürünler" },
  { href: "/#hizmetler", label: "Hizmetler" },
  { href: "/#iletisim", label: "İletişim" },
] as const;

export async function SiteFooter() {
  const siteConfig = await getSiteConfig();

  /*
    Yıl sunucuda hesaplanır. Sayfalar `revalidate` ile yeniden üretildiği
    için yıl dönümünde en geç bir sonraki üretimde güncellenir; istemci
    tarafında hesaplansaydı hidrasyon uyuşmazlığı riski doğardı.
  */
  const year = new Date().getFullYear();

  const hasContactDetails =
    siteConfig.addressLine !== null ||
    siteConfig.workingHours !== null ||
    siteConfig.phoneDisplay !== null;

  return (
    <footer className="rf-on-dark mt-auto border-t border-border bg-surface-dark">
      <Container width="wide" className="py-(--spacing-section-tight)">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <Logo />
            {/*
              Tek cümlelik tanım. İddia değil tanımdır: ne yaptığımızı söyler,
              ölçülemez bir üstünlük ("Türkiye'nin en iyisi") kurmaz.
            */}
            <p className="mt-4 text-body text-text-muted">
              Gaziantep merkezli robot süpürge teknik servisi, bakım, onarım ve yedek parça.
            </p>
          </div>

          <div className="flex flex-col gap-10 sm:flex-row sm:gap-16">
            <nav aria-labelledby="alt-bilgi-gezinme">
              <h2 id="alt-bilgi-gezinme" className="text-overline text-accent-tech">
                Site haritası
              </h2>
              <ul className="mt-4 flex flex-col gap-1">
                {FOOTER_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-11 items-center text-body text-text-muted transition-colors duration-(--duration-fast) hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {hasContactDetails && (
              <section aria-labelledby="alt-bilgi-iletisim">
                <h2 id="alt-bilgi-iletisim" className="text-overline text-accent-tech">
                  İletişim
                </h2>
                <ul className="mt-4 flex flex-col gap-3 text-body text-text-muted">
                  {siteConfig.addressLine && (
                    <li className="flex items-start gap-2">
                      <MapPinIcon className="mt-0.5 size-5 shrink-0" />
                      <span>{siteConfig.addressLine}</span>
                    </li>
                  )}
                  {siteConfig.workingHours && (
                    <li className="flex items-start gap-2">
                      <ClockIcon className="mt-0.5 size-5 shrink-0" />
                      <span>{siteConfig.workingHours}</span>
                    </li>
                  )}
                  {siteConfig.phoneDisplay && (
                    <li className="flex items-start gap-2">
                      <PhoneIcon className="mt-0.5 size-5 shrink-0" />
                      <span>{siteConfig.phoneDisplay}</span>
                    </li>
                  )}
                </ul>

                {siteConfig.mapsUrl && (
                  <a
                    href={siteConfig.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex min-h-11 items-center gap-2 text-body text-link hover:text-link-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    Haritada aç
                    <ExternalLinkIcon className="size-4" />
                    <span className="sr-only">(yeni sekmede açılır)</span>
                  </a>
                )}
              </section>
            )}

            {siteConfig.storeLinks.length > 0 && (
              <section aria-labelledby="alt-bilgi-pazaryeri">
                <h2 id="alt-bilgi-pazaryeri" className="text-overline text-accent-tech">
                  Pazaryerleri
                </h2>
                <ul className="mt-4 flex flex-col gap-1">
                  {siteConfig.storeLinks.map((store) => (
                    <li key={store.marketplace}>
                      <a
                        href={store.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 text-body text-text-muted transition-colors duration-(--duration-fast) hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      >
                        {store.label}
                        <ExternalLinkIcon className="size-4" />
                        <span className="sr-only">(yeni sekmede açılır)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-border pt-6 text-caption text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Robot Fix</p>

          {/*
            YAPIMCI ATFI — Robot Fix'in bir iddiası değil, siteyi yapan
            stüdyonun imzasıdır. Bu yüzden telif satırının yanında, aynı
            sessiz `text-caption` ölçeğinde durur; kendi bölümü veya
            vurgulu bir rozeti yoktur.

            Logo METİN DEĞİL bir çizimdir, bu yüzden `alt=""` ile dekoratif
            işaretlenir: adı hemen yanındaki gerçek metin zaten söylüyor;
            aksi hâlde ekran okuyucu "VenaTech VenaTech" derdi. Aynı sebeple
            ad görsele gömülü bırakılmaz — arama motoru ve ekran okuyucu için
            metin olarak yazılır.

            Kırmızı işaret Robot Fix paletinin parçası DEĞİLDİR ve öyle
            davranmaz: yalnız bu 20 px'lik imzada geçer, hiçbir semantik
            role bağlanmaz. Gece Laciverti üstünde ölçülen oran 4.07:1 —
            metin olmayan grafik için WCAG 1.4.11 sınırının (3:1) üstünde.

            TODO(business): VenaTech'in resmî adresi doğrulandığında bu blok,
            yukarıdaki harici bağlantılarla aynı kuralla (yeni sekme + noopener
            noreferrer) bir bağlantıya dönüşebilir. Doğrulanmamış adres yazılmaz.
          */}
          <p className="inline-flex items-center gap-2">
            <span>Powered by</span>
            <Image
              src="/gorseller/vena-logo.png"
              alt=""
              width={151}
              height={96}
              className="h-5 w-auto"
            />
            <span className="font-medium text-text">VenaTech</span>
          </p>
        </div>
      </Container>
    </footer>
  );
}
