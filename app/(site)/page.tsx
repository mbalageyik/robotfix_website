import type { Metadata } from "next";
import { Fragment } from "react";
import { HOMEPAGE_SECTIONS, type HomeData } from "@/components/home/sections";
import { listFeaturedProducts } from "@/lib/data/products";
import { getHomeSectionsConfig } from "@/lib/data/site-settings";
import { listBrands, listCategories, listServices } from "@/lib/data/taxonomy";
import { buildOrganizationJsonLd } from "@/lib/home/organization-jsonld";
import { visibleHomeSections } from "@/lib/home/section-registry";
import { getSiteConfig, siteUrl } from "@/lib/site-config";
import { jsonLdHtml } from "@/lib/seo/json-ld";

/*
  ANA SAYFA (bilgi dosyası §13).

  YAPI: sayfa hiçbir bölümü kendi JSX'inde tarif etmez. Bölümlerin sırası ve
  varsayılan durumu `lib/home/section-registry.ts` kaydında, render eşlemesi
  `components/home/sections.tsx` içindedir; burası yalnız veriyi toplar ve
  kaydı dolaşır.

  PANEL KONTROLÜ (§17 "ana sayfa bölümleri"): açıklık ve onay durumu artık
  `site_settings` içindeki tek bir JSON anahtarından okunur ve kod
  varsayılanlarının ÜZERİNE yazılır (`visibleHomeSections`). Anahtar boşsa
  kayıttaki varsayılanlar geçerlidir. Karar SUNUCUDA verilir: kapatılan bölüm
  hiç render edilmez, istemciye gizlenecek bir işaret gönderilmez.

  ONAY BEKLEYEN İÇERİK: `contentStatus: "draft"` olan bölüm (servis süreci,
  SSS) yönetici panelden "Yayında" yapmadıkça herkese açık sayfada
  GÖSTERİLMEZ. Bu, bilgi dosyası §20'nin gereğidir — işletme onayından
  geçmemiş metin yayımlanmaz.

  GÖRÜNÜRLÜK: bu sayfadaki hiçbir sorgu `status` filtresi YAZMAZ — kural
  `lib/data/products.ts` başındaki gerekçeyle aynıdır, taslak/pasif satırları
  RLS eler. Şu an tohum verisinin tamamı draft olduğu için seçki, kategori,
  marka ve hizmet bölümleri boş döner; bu beklenen durumdur ve sahte içerikle
  doldurulmaz.

  İSTEMCİ JS: kaydırmaya bağlı sunum katmanları istemci bileşenlerinde yaşar;
  açılış için bu sınır `components/ui/scroll-choreography.tsx` dosyasıdır.
  Başlık ve CTA'lar sunucuda üretilip sahneye geçirilir. SSS'nin açılır
  davranışı `<details>` ile tarayıcıya aittir.

  HERO: `giris` bölümü dört yerel robot süpürge/teknik servis stok görselini
  tek bir sahnede birleştiren kaydırma koreografisidir (`components/home/Hero.tsx`).
  Görseller HÂLÂ yer tutucudur — gerçek ürün ve atölye fotoğrafları bekleniyor.
*/

/** Katalogla aynı tazelik penceresi: panelden yapılan değişiklik 5 dk içinde yansır. */
export const revalidate = 300;

const HOME_DESCRIPTION =
  "Robot Fix; Gaziantep merkezli robot süpürge teknik servisi, bakım, onarım ve " +
  "yedek parça çözümleri sunar. Cihazınızın marka ve modeline uygun parçayı birlikte belirleyelim.";

export const metadata: Metadata = {
  /*
    `absolute`: kök düzendeki "%s — Robot Fix" şablonu burada uygulanmaz,
    aksi hâlde marka adı başlıkta iki kez geçerdi.
    Marka adı HER ZAMAN iki kelimedir: "Robot Fix" (CLAUDE.md).
  */
  title: { absolute: "Robot Fix — Robot Süpürge Teknik Servisi ve Yedek Parça" },
  description: HOME_DESCRIPTION,
  alternates: { canonical: siteUrl },
  openGraph: {
    type: "website",
    siteName: "Robot Fix",
    title: "Robot Fix — Robot Süpürge Teknik Servisi ve Yedek Parça",
    description: HOME_DESCRIPTION,
    url: siteUrl,
    locale: "tr_TR",
  },
};

export default async function Home() {
  /*
    Dört sorgu birbirinden bağımsızdır; sırayla beklemek için sebep yok.
    Hiçbiri `throw` etmez — her biri `DataResult` döner ve ilgili bölüm
    kendi boş/hata durumunu kendisi karşılar. Böylece bir sorgunun
    başarısızlığı ana sayfayı düşürmez.
  */
  const [featured, categories, brands, services, siteConfig, sectionsConfig] = await Promise.all([
    listFeaturedProducts(8),
    listCategories(),
    listBrands(),
    listServices(),
    getSiteConfig(),
    getHomeSectionsConfig(),
  ]);

  const data: HomeData = { featured, categories, brands, services, siteConfig };

  /*
    Yapılandırılmış veri YALNIZ doğrulanmış alanlardan üretilir: puan, yorum,
    sertifika veya çalışma saati makine biçimi ÜRETİLMEZ (gerekçeler
    `lib/home/organization-jsonld.ts` içinde).
  */
  const organizationJsonLd = buildOrganizationJsonLd({
    siteUrl,
    name: "Robot Fix",
    description: HOME_DESCRIPTION,
    addressLine: siteConfig.addressLine,
    phone: siteConfig.whatsappPhone,
    storeUrls: siteConfig.storeLinks.map((link) => link.url),
  });

  return (
    <main id="icerik" tabIndex={-1} className="flex-1">
      {/* Yapılandırılmış veri yalnız yukarıdaki gerçek alanlardan üretilir. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(organizationJsonLd)} />

      {visibleHomeSections(HOMEPAGE_SECTIONS, sectionsConfig).map((section) => (
        <Fragment key={section.id}>{section.render(data)}</Fragment>
      ))}
    </main>
  );
}
