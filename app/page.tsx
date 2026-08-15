import type { Metadata } from "next";
import { Fragment } from "react";
import { HOMEPAGE_SECTIONS, type HomeData } from "@/components/home/sections";
import { listFeaturedProducts } from "@/lib/data/products";
import { listBrands, listCategories, listServices } from "@/lib/data/taxonomy";
import { buildOrganizationJsonLd } from "@/lib/home/organization-jsonld";
import { getSiteConfig, siteUrl } from "@/lib/site-config";

/*
  ANA SAYFA (bilgi dosyası §13).

  YAPI: sayfa hiçbir bölümü kendi JSX'inde tarif etmez. Bölümlerin sırası,
  açıklığı ve içerik onay durumu `components/home/sections.tsx` içindeki
  `HOMEPAGE_SECTIONS` kaydındadır; burası yalnız veriyi toplar ve kaydı
  dolaşır. Panel entegrasyonu (§17 "ana sayfa bölümleri") geldiğinde
  değişecek tek yer o kayıttır.

  GÖRÜNÜRLÜK: bu sayfadaki hiçbir sorgu `status` filtresi YAZMAZ — kural
  `lib/data/products.ts` başındaki gerekçeyle aynıdır, taslak/pasif satırları
  RLS eler. Şu an tohum verisinin tamamı draft olduğu için seçki, kategori,
  marka ve hizmet bölümleri boş döner; bu beklenen durumdur ve sahte içerikle
  doldurulmaz.

  İSTEMCİ JS: sayfada tek bir istemci bileşeni yoktur. Tüm bölümler sunucuda
  render edilir; SSS'nin açılır davranışı `<details>` ile tarayıcıya aittir.

  HERO: `giris` bölümü GEÇİCİ bir yer tutucudur — gerçek sinematik/3D açılış
  ayrı bir tasarım kararı bekler (bkz. `components/home/HeroPlaceholder.tsx`).
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
  const [featured, categories, brands, services, siteConfig] = await Promise.all([
    listFeaturedProducts(8),
    listCategories(),
    listBrands(),
    listServices(),
    getSiteConfig(),
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
    <main className="flex-1">
      {/* Yapılandırılmış veri yalnız yukarıdaki gerçek alanlardan üretilir. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      {HOMEPAGE_SECTIONS.filter((section) => section.enabled).map((section) => (
        <Fragment key={section.id}>{section.render(data)}</Fragment>
      ))}
    </main>
  );
}
