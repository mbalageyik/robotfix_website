import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { Container } from "@/components/layout/Container";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { getHomeSectionsConfig } from "@/lib/data/site-settings";
import { HOMEPAGE_SECTION_META, visibleHomeSections } from "@/lib/home/section-registry";

/*
  ============================================================================
  GENEL SİTE BAŞLIĞI — sunucu bileşeni, istemci JS yok.
  ============================================================================

  DAR EKRAN MENÜSÜ `<details>` İLE AÇILIR, React durumuyla değil. Gerekçe
  bilgi dosyası §14: JS yüklenmese de ürün, hizmet ve iletişim bilgisi
  erişilebilir kalmalıdır. `<details>` açma/kapama işini tarayıcıya bırakır;
  klavye, ekran okuyucu ve JS'siz ziyaretçi için çalışır. Aynı tercih SSS
  bölümünde de yapıldı.

  ÇAPALAR GERÇEKTEN VAR OLANLARA VERİLİR. Ana sayfa bölümleri panelden
  kapatılabilir (`site_settings` → ana sayfa bölümleri). Kapalı bir bölüme
  bağlantı vermek, tıklandığında hiçbir yere gitmeyen bir menü demektir; bu
  yüzden menü kaydı okur ve YALNIZ görünen bölümlerin çapasını gösterir.
  Aynı ilke pazaryeri butonlarındaki "bağlantı yoksa buton hiç gösterilmez"
  kuralıdır.

  ÇAPALAR KÖKE GÖRE MUTLAKTIR (`/#hizmetler`, `#hizmetler` değil): başlık
  ürün detay sayfasında da durur ve orada göreli bir çapa aynı sayfada
  boşluğa işaret ederdi.
*/

/** Menüde yer alabilecek ana sayfa çapaları — kayıttaki kimliklerle eşleşir. */
const ANCHOR_LINKS = [
  { sectionId: "hizmetler", label: "Hizmetler" },
  { sectionId: "uyumluluk", label: "Uyumluluk" },
  { sectionId: "iletisim", label: "İletişim" },
] as const;

/** Her zaman var olan gerçek rotalar — panel yapılandırmasından bağımsız. */
const ROUTE_LINKS = [{ href: "/urunler", label: "Ürünler" }] as const;

interface NavLink {
  href: string;
  label: string;
}

async function resolveNavLinks(): Promise<NavLink[]> {
  const config = await getHomeSectionsConfig();
  const visibleIds = new Set(
    visibleHomeSections(HOMEPAGE_SECTION_META, config).map((section) => section.id),
  );

  const anchors = ANCHOR_LINKS.filter((link) => visibleIds.has(link.sectionId)).map((link) => ({
    href: `/#${link.sectionId}`,
    label: link.label,
  }));

  /*
    Sıra: önce katalog rotası, sonra ana sayfa çapaları. Ürünler gerçek bir
    sayfadır ve menünün en çok tıklanan öğesidir; çapalar onun ardından gelir.
  */
  return [...ROUTE_LINKS, ...anchors];
}

export async function SiteHeader() {
  const links = await resolveNavLinks();

  return (
    <header
      /*
        `sticky`: başlık kaydırmada üstte kalır. Yüksekliği düşük tutuldu
        (min-h-16) — yapışkan bir başlık ekranın her zaman bir parçasını yer,
        o payın küçük olması gerekir.
      */
      className="sticky top-0 z-50 border-b border-border bg-surface/85 backdrop-blur-md"
    >
      <Container width="wide" className="flex min-h-16 items-center gap-4 py-3">
        {/*
          Logo ana sayfaya götürür. `aria-label` YOK: bağlantının erişilebilir
          adı zaten içindeki "Robot Fix" metnidir, ayrıca ad vermek onu
          gölgelerdi.
        */}
        <Link
          href="/"
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <Logo />
        </Link>

        {/* Geniş ekran gezinmesi. */}
        <nav aria-label="Ana gezinme" className="ml-auto hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-11 items-center rounded-md px-3 text-body font-medium text-text-muted transition-colors duration-(--duration-fast) hover:bg-surface-sunken hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/*
          CTA yalnız geniş ekranda başlıkta durur; dar ekranda menünün içine
          iner. Numara yapılandırılmamışsa `WhatsAppButton` zaten `null`
          döner — bozuk bir wa.me bağlantısı gösterilmez.
        */}
        <div className="hidden md:block">
          <WhatsAppButton
            intent="service"
            label="Servis Talebi"
            size="sm"
            event="whatsapp_header_click"
          />
        </div>

        {/*
          DAR EKRAN AÇICISI.

          `group` + `open:` varyantı: açıkken hamburger yerine çarpı gösterilir.
          `<summary>` varsayılan üçgen işaretini `list-none` + `[&::-webkit-details-marker]`
          ile kaldırıyoruz, aksi hâlde simgenin yanında ikinci bir ok dururdu.
        */}
        <details className="group relative ml-auto md:hidden">
          <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md px-3 text-body font-medium text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus [&::-webkit-details-marker]:hidden">
            <MenuIcon className="size-5 group-open:hidden" />
            <CloseIcon className="hidden size-5 group-open:block" />
            Menü
          </summary>

          <nav
            aria-label="Ana gezinme"
            className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-border bg-surface-raised p-2 shadow-(--shadow-e2)"
          >
            <ul className="flex flex-col">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex min-h-11 items-center rounded-md px-3 text-body font-medium text-text-muted transition-colors duration-(--duration-fast) hover:bg-surface-sunken hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-2 border-t border-border pt-2">
              <WhatsAppButton
                intent="service"
                label="Servis Talebi"
                size="sm"
                fullWidth
                event="whatsapp_header_click"
              />
            </div>
          </nav>
        </details>
      </Container>
    </header>
  );
}
