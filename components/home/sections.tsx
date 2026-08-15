import type { ReactNode } from "react";
import { BrandsSection } from "@/components/home/BrandsSection";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { CompatibilitySection } from "@/components/home/CompatibilitySection";
import { ContactSection } from "@/components/home/ContactSection";
import { FaqSection } from "@/components/home/FaqSection";
import { FeaturedProductsSection } from "@/components/home/FeaturedProductsSection";
import { Hero } from "@/components/home/Hero";
import { MarketplaceSection } from "@/components/home/MarketplaceSection";
import { ServiceProcessSection } from "@/components/home/ServiceProcessSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { TrustSection } from "@/components/home/TrustSection";
import { ValuePropositionSection } from "@/components/home/ValuePropositionSection";
import type { DataResult } from "@/lib/data/result";
import type { BrandRow, CategoryRow, ProductListItem, ServiceRow } from "@/lib/data/types";
import {
  HOMEPAGE_SECTION_META,
  type HomeSectionId,
  type HomeSectionMeta,
} from "@/lib/home/section-registry";
import type { ResolvedSiteConfig } from "@/lib/site-config";

/*
  ANA SAYFA BÖLÜMLERİNİN RENDER EŞLEMESİ.

  Bölümlerin KİMLİĞİ, SIRASI ve varsayılan durumu artık burada değil,
  `lib/home/section-registry.ts` içindedir — çünkü o veriyi yönetim paneli de
  okur ve panelin bütün bölüm bileşenlerini içe aktarması gerekmemelidir.

  Bu dosya yalnız "hangi kimlik hangi bileşeni çizer" sorusuna cevap verir.
  Eşleme `Record<HomeSectionId, ...>` tipindedir: kayda bir bölüm eklenir de
  render'ı yazılmazsa typecheck kırılır, tersi de geçerlidir.

  Sayfa bu diziyi gerçekten dolaşır — sıra kayıtta değişince sayfada da
  değişir. Yorum satırında duran, kod tarafından kullanılmayan bir "plan"
  değildir.
*/

export interface HomeData {
  featured: DataResult<ProductListItem[]>;
  categories: DataResult<CategoryRow[]>;
  brands: DataResult<BrandRow[]>;
  services: DataResult<ServiceRow[]>;
  siteConfig: ResolvedSiteConfig;
}

export interface HomeSection extends HomeSectionMeta {
  render: (data: HomeData) => ReactNode;
}

/*
  Veri-bağımlı bölümler (seçki, kategoriler, markalar, hizmetler) kendi
  boş/hata durumlarını KENDİLERİ karşılar. Panel kontrolü bunun ÜSTÜNE binen
  ayrı bir katmandır: bölüm kapatılmışsa hiç çağrılmaz, açıksa bileşenin
  bugünkü davranışı aynen sürer.
*/
const SECTION_RENDERERS: Record<HomeSectionId, (data: HomeData) => ReactNode> = {
  giris: () => <Hero />,
  hakkinda: () => <ValuePropositionSection />,
  secki: (data) => <FeaturedProductsSection result={data.featured} />,
  kategoriler: (data) => <CategoriesSection result={data.categories} />,
  markalar: (data) => <BrandsSection result={data.brands} />,
  hizmetler: (data) => <ServicesSection result={data.services} />,
  uyumluluk: () => <CompatibilitySection />,
  surec: () => <ServiceProcessSection />,
  pazaryerleri: (data) => <MarketplaceSection siteConfig={data.siteConfig} />,
  guven: (data) => <TrustSection siteConfig={data.siteConfig} />,
  sss: () => <FaqSection />,
  iletisim: (data) => <ContactSection siteConfig={data.siteConfig} />,
};

/** Kayıt + render eşlemesi. Sıra kayıttan gelir. */
export const HOMEPAGE_SECTIONS: readonly HomeSection[] = HOMEPAGE_SECTION_META.map((meta) => ({
  ...meta,
  render: SECTION_RENDERERS[meta.id],
}));
