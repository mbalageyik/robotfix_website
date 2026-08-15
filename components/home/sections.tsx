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
import type { ResolvedSiteConfig } from "@/lib/site-config";

/*
  ANA SAYFA BÖLÜM KAYDI.

  NEDEN BİR KAYIT: bilgi dosyası §17, "ana sayfa bölümleri"ni yönetim
  panelinden kontrol edilebilir alanlar arasında sayar. O entegrasyon BU
  GÖREVİN KAPSAMINDA DEĞİLDİR; ama sıra ve açıklık bugünden TEK BİR YERDE
  toplanır, sayfanın JSX'ine dağılmaz. Panel geldiğinde değişecek olan bu
  dizinin KAYNAĞIDIR (koddan → veritabanından), tüketicisi değil.

  Sayfa bu diziyi gerçekten dolaşır — sıra burada değişince sayfada da
  değişir. Yorum satırında duran, kod tarafından kullanılmayan bir "plan"
  değildir.

  `contentStatus`:
    - "live"  : içerik ya veritabanından gelir ya da bilgi dosyasındaki
                doğrulanmış konumlandırma metnidir.
    - "draft" : işletme onayı bekleyen metin (servis süreci, SSS). Kod
                içinde `TODO(business)` ile de işaretlidir.
*/

export interface HomeData {
  featured: DataResult<ProductListItem[]>;
  categories: DataResult<CategoryRow[]>;
  brands: DataResult<BrandRow[]>;
  services: DataResult<ServiceRow[]>;
  siteConfig: ResolvedSiteConfig;
}

export interface HomeSection {
  /** DOM `id`'si ve çapa adı. Sayfa içi bağlantılarda kullanılır. */
  id: string;
  /** Panelde ve raporlarda görünecek insan-okunur ad. */
  label: string;
  /** İçerik onay durumu. */
  contentStatus: "live" | "draft";
  /**
   * Bölüm yayında mı. Şimdilik koda sabittir; panel entegrasyonunda
   * `site_settings`ten okunacak tek alan budur.
   */
  enabled: boolean;
  render: (data: HomeData) => ReactNode;
}

/*
  Sıra bilgi dosyası §13'teki içerik akışını izler. §13'ün 10. maddesindeki
  "doğrulanmış müşteri kanıtları" bölümü BİLİNÇLİ OLARAK YOKTUR: doğrulanmış
  müşteri kanıtımız yok, uydurulamaz (§20). Yerinde yalnız işletmenin kendi
  girdiği adres ve çalışma saati durur (`guven`).
*/
export const HOMEPAGE_SECTIONS: readonly HomeSection[] = [
  {
    id: "giris",
    label: "Açılış — kaydırmaya bağlı kart",
    contentStatus: "live",
    enabled: true,
    render: () => <Hero />,
  },
  {
    id: "hakkinda",
    label: "Değer önerisi",
    contentStatus: "live",
    enabled: true,
    render: () => <ValuePropositionSection />,
  },
  {
    id: "secki",
    label: "Robot Fix Seçkisi",
    contentStatus: "live",
    enabled: true,
    render: (data) => <FeaturedProductsSection result={data.featured} />,
  },
  {
    id: "kategoriler",
    label: "Ürün kategorileri",
    contentStatus: "live",
    enabled: true,
    render: (data) => <CategoriesSection result={data.categories} />,
  },
  {
    id: "markalar",
    label: "Markalar",
    contentStatus: "live",
    enabled: true,
    render: (data) => <BrandsSection result={data.brands} />,
  },
  {
    id: "hizmetler",
    label: "Teknik servis hizmetleri",
    contentStatus: "live",
    enabled: true,
    render: (data) => <ServicesSection result={data.services} />,
  },
  {
    id: "uyumluluk",
    label: "Uyumluluk anlatımı",
    contentStatus: "live",
    enabled: true,
    render: () => <CompatibilitySection />,
  },
  {
    id: "surec",
    label: "Servis süreci",
    contentStatus: "draft",
    enabled: true,
    render: () => <ServiceProcessSection />,
  },
  {
    id: "pazaryerleri",
    label: "Pazaryeri satış kanalları",
    contentStatus: "live",
    enabled: true,
    render: (data) => <MarketplaceSection siteConfig={data.siteConfig} />,
  },
  {
    id: "guven",
    label: "Güven unsurları (adres, çalışma saatleri)",
    contentStatus: "live",
    enabled: true,
    render: (data) => <TrustSection siteConfig={data.siteConfig} />,
  },
  {
    id: "sss",
    label: "Sık sorulan sorular",
    contentStatus: "draft",
    enabled: true,
    render: () => <FaqSection />,
  },
  {
    id: "iletisim",
    label: "İletişim, konum ve WhatsApp",
    contentStatus: "live",
    enabled: true,
    render: (data) => <ContactSection siteConfig={data.siteConfig} />,
  },
];
