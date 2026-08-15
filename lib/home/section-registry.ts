/*
  ANA SAYFA BÖLÜM KAYDI — kimlik, sıra ve varsayılan durum.

  NEDEN JSX'TEN AYRI BİR DOSYA: bu kaydı artık İKİ taraf okuyor —
  ziyaretçiye render eden `components/home/sections.tsx` ve yöneticiye liste
  gösteren `/admin/ana-sayfa`. Meta veriyi JSX dosyasında bırakmak, panelin
  Hero'yu, ürün kartlarını ve tüm bölüm bileşenlerini içe aktarması demekti.
  Burada yalnız VERİ durur; render eşlemesi JSX dosyasında kalır ve iki liste
  `Record<HomeSectionId, ...>` tipiyle birbirine kilitlenir: bir bölüm
  eklenip render'ı unutulursa typecheck kırılır.

  `contentStatus`:
    - "live"  : içerik ya veritabanından gelir ya da bilgi dosyasındaki
                doğrulanmış konumlandırma metnidir.
    - "draft" : işletme onayı bekleyen metin (servis süreci, SSS). Kod içinde
                `TODO(business)` ile de işaretlidir ve ONAYLANANA KADAR
                herkese açık sayfada GÖSTERİLMEZ. Yönetici panelden
                "Yayında" yaptığında görünür.

  Panelden gelen override'lar `site_settings` içindeki tek bir JSON anahtarında
  tutulur (aşağıdaki `HOMEPAGE_SECTIONS_SETTING_KEY`). Anahtar boşsa buradaki
  varsayılanlar geçerlidir — panel hiç kullanılmasa da site çalışır.
*/

import { z } from "zod";

export type HomeSectionContentStatus = "live" | "draft";

/**
 * Onay durumlarının çalışma zamanı listesi — doğrulama şemaları buradan
 * beslenir (`lib/admin/schemas.ts`). Tip ile liste `satisfies` ile bağlıdır:
 * birine değer eklenip diğerine eklenmezse typecheck kırılır.
 */
export const HOME_SECTION_CONTENT_STATUSES = [
  "live",
  "draft",
] as const satisfies readonly HomeSectionContentStatus[];

export interface HomeSectionMeta {
  /** DOM `id`'si ve çapa adı. Sayfa içi bağlantılarda kullanılır. */
  id: string;
  /** Panelde ve raporlarda görünecek insan-okunur ad. */
  label: string;
  /** İçerik onay durumunun KOD İÇİ varsayılanı. */
  contentStatus: HomeSectionContentStatus;
  /** Bölümün KOD İÇİ varsayılan açıklığı. */
  enabled: boolean;
}

/*
  Sıra bilgi dosyası §13'teki içerik akışını izler. §13'ün 10. maddesindeki
  "doğrulanmış müşteri kanıtları" bölümü BİLİNÇLİ OLARAK YOKTUR: doğrulanmış
  müşteri kanıtımız yok, uydurulamaz (§20). Yerinde yalnız işletmenin kendi
  girdiği adres ve çalışma saati durur (`guven`).

  SIRA PANELDEN DEĞİŞTİRİLEMEZ ve bu bilinçlidir: sıra bir içerik akışı
  kararıdır (§13), bir tercih değil. Panel yalnız açıklığı ve onay durumunu
  yönetir.
*/
export const HOMEPAGE_SECTION_META = [
  {
    id: "giris",
    label: "Açılış — kaydırmaya bağlı kart",
    contentStatus: "live",
    enabled: true,
  },
  {
    id: "hakkinda",
    label: "Değer önerisi",
    contentStatus: "live",
    enabled: true,
  },
  {
    id: "secki",
    label: "Robot Fix Seçkisi",
    contentStatus: "live",
    enabled: true,
  },
  {
    id: "kategoriler",
    label: "Ürün kategorileri",
    contentStatus: "live",
    enabled: true,
  },
  {
    id: "markalar",
    label: "Markalar",
    contentStatus: "live",
    enabled: true,
  },
  {
    id: "hizmetler",
    label: "Teknik servis hizmetleri",
    contentStatus: "live",
    enabled: true,
  },
  /*
    §13'ün akışına EKLENEN tek bölüm. Yeri seçimdir, boşluk doldurma değil:
    hizmet listesinin (6) hemen ardından gelir ve o listenin arkasındaki
    uzmanlık iddiasını taşır (§2, §22 · 1). Uyumluluk anlatımından (7) ÖNCEDİR,
    çünkü uyumluluk artık bir ürün/katalog konusudur — araya girmesi servis
    temasını böler.

    `contentStatus: "live"`: metin işletme onayı bekleyen bir operasyonel
    anlatım değil, §2'deki onaylı konumlandırmanın karşılığıdır. Görüntünün
    yer tutucu olması ONAY DURUMU DEĞİLDİR; o, alt metninde ve kod yorumunda
    işaretlidir.
  */
  {
    id: "servis-vitrini",
    label: "Servis vitrini — teknik servis anlatımı",
    contentStatus: "live",
    enabled: true,
  },
  {
    id: "uyumluluk",
    label: "Uyumluluk anlatımı",
    contentStatus: "live",
    enabled: true,
  },
  {
    id: "surec",
    label: "Servis süreci",
    contentStatus: "draft",
    enabled: true,
  },
  {
    id: "pazaryerleri",
    label: "Pazaryeri satış kanalları",
    contentStatus: "live",
    enabled: true,
  },
  {
    id: "guven",
    label: "Güven unsurları (adres, çalışma saatleri)",
    contentStatus: "live",
    enabled: true,
  },
  {
    id: "sss",
    label: "Sık sorulan sorular",
    contentStatus: "draft",
    enabled: true,
  },
  {
    id: "iletisim",
    label: "İletişim, konum ve WhatsApp",
    contentStatus: "live",
    enabled: true,
  },
] as const satisfies readonly HomeSectionMeta[];

/** Kayıtlı bölüm kimliklerinin birleşimi. Yazım hatası typecheck'te yakalanır. */
export type HomeSectionId = (typeof HOMEPAGE_SECTION_META)[number]["id"];

/*
  ZORUNLU BÖLÜMLER — panelden KAPATILAMAZ.

  `giris`  : sayfanın `h1`'i, değer önerisi ve iki birincil CTA buradadır.
             Kapatılırsa ana sayfa başlıksız kalır; SEO ve erişilebilirlik
             açısından belge yapısı bozulur (§14: 3D/hareket yüklenmese de
             ürün, hizmet ve iletişim bilgisi erişilebilir kalmalıdır).
  `iletisim`: adres, harita ve WhatsApp yolu buradadır. Bilgi dosyası §14 bu
             bilginin HER durumda erişilebilir kalmasını şart koşar; panelden
             bir yanlış tıklamayla işletmenin tek dönüşüm yolunun kaybolması
             kabul edilemez.

  Diğer bölümler (güven, pazaryerleri, seçki…) kapatılabilir: içerikleri ya
  veriye bağlıdır ya da isteğe bağlı anlatımdır.
*/
export const LOCKED_SECTION_IDS = ["giris", "iletisim"] as const satisfies readonly HomeSectionId[];

export function isLockedSection(id: string): boolean {
  return (LOCKED_SECTION_IDS as readonly string[]).includes(id);
}

// ---------------------------------------------------------------------------
// Panelden gelen yapılandırma
// ---------------------------------------------------------------------------

/**
 * `site_settings` anahtarı.
 *
 * NEDEN TEK JSON ANAHTARI (bölüm başına bir satır değil): bölüm listesi kodun
 * kararıdır, veritabanının değil. Satır başına anahtar açsaydık kaydı kodda
 * değiştirmek her seferinde veritabanı bakımı gerektirirdi; ayrıca panel tek
 * `upsert` yerine N satır yazardı. `value` sütunu `text` olduğu için JSON
 * saklamak ŞEMA DEĞİŞİKLİĞİ GEREKTİRMEZ — anahtar-değer tablosu tam da bunun
 * için seçilmişti (migrasyon yorumu, `20260812000200_catalog.sql`).
 *
 * Bu anahtar `SITE_SETTING_KEYS` listesinde BİLİNÇLİ OLARAK YOKTUR: o liste
 * site ayarları FORMUNUN alanlarıdır ve o form her kaydedişte listedeki tüm
 * anahtarları yazar. Anahtar oraya eklenseydi site ayarları formu her
 * kaydedişte bölüm yapılandırmasını sıfırlardı.
 */
export const HOMEPAGE_SECTIONS_SETTING_KEY = "homepage_sections";

/** Tek bir bölümün panelden gelen override'ı. Alanlar isteğe bağlıdır. */
export interface HomeSectionOverride {
  enabled?: boolean;
  contentStatus?: HomeSectionContentStatus;
}

/** Bölüm kimliği → override. Eksik kimlik "varsayılana düş" demektir. */
export type HomeSectionsConfig = Record<string, HomeSectionOverride>;

export const EMPTY_HOME_SECTIONS_CONFIG: HomeSectionsConfig = {};

/*
  Saklanan JSON'un şeması. Veritabanı değeri elle de düzenlenebilir; bu yüzden
  okuma tarafında da doğrulanır. Bilinmeyen alanlar zod tarafından düşürülür.
*/
const overrideSchema = z.object({
  enabled: z.boolean().optional(),
  contentStatus: z.enum(["live", "draft"]).optional(),
});

const configSchema = z.record(z.string(), overrideSchema);

/**
 * Saklanan ham değeri yapılandırmaya çevirir.
 *
 * ASLA HATA FIRLATMAZ. Bozuk veya elle bozulmuş bir JSON yüzünden ana sayfanın
 * düşmesi, panelden yapılabilecek en pahalı hata olurdu; böyle bir durumda
 * kod içi varsayılanlara (yani bugünkü siteye) dönülür ve sunucu günlüğüne
 * yazılır.
 */
export function parseHomeSectionsConfig(raw: string | null | undefined): HomeSectionsConfig {
  const trimmed = raw?.trim();
  if (!trimmed) return EMPTY_HOME_SECTIONS_CONFIG;

  let json: unknown;
  try {
    json = JSON.parse(trimmed);
  } catch {
    console.error(
      "[home-sections] kayıtlı yapılandırma JSON olarak okunamadı; varsayılanlar kullanılıyor.",
    );
    return EMPTY_HOME_SECTIONS_CONFIG;
  }

  const parsed = configSchema.safeParse(json);
  if (!parsed.success) {
    console.error(
      "[home-sections] kayıtlı yapılandırma beklenen biçimde değil; varsayılanlar kullanılıyor.",
    );
    return EMPTY_HOME_SECTIONS_CONFIG;
  }

  return parsed.data;
}

/** Yapılandırmayı `site_settings.value` için metne çevirir. */
export function serializeHomeSectionsConfig(config: HomeSectionsConfig): string {
  return JSON.stringify(config);
}

/** Kod varsayılanı ile panel override'ı birleştirilmiş bölüm. */
export type ResolvedHomeSection<T extends HomeSectionMeta> = T & {
  /** Birleşmiş açıklık. Zorunlu bölümlerde her zaman `true`. */
  enabled: boolean;
  /** Birleşmiş onay durumu. Zorunlu bölümlerde her zaman `"live"`. */
  contentStatus: HomeSectionContentStatus;
  /** Panelden kapatılamaz mı. */
  locked: boolean;
  /** Herkese açık sayfada render edilir mi. */
  isVisible: boolean;
  /** Panel override'ı bu bölümün varsayılanını değiştiriyor mu. */
  isOverridden: boolean;
};

/**
 * Kod kaydını panel yapılandırmasıyla birleştirir.
 *
 * KURALLAR:
 *   - Zorunlu bölümün override'ı YOK SAYILIR (açık ve "live" kalır).
 *   - Eksik alan kod varsayılanına düşer; boş yapılandırma = bugünkü site.
 *   - Kayıtta olmayan bir kimlik yapılandırmada duruyorsa görmezden gelinir
 *     (bölüm koddan kaldırılmış olabilir).
 *   - Görünürlük iki koşulun BİRLİKTE sağlanmasıdır: açık VE onaylı içerik.
 *     Onaysız metin (`draft`), bölüm açık olsa bile yayımlanmaz — bilgi
 *     dosyası §20'nin doğrudan sonucudur.
 */
export function resolveHomeSections<T extends HomeSectionMeta>(
  sections: readonly T[],
  config: HomeSectionsConfig,
): ResolvedHomeSection<T>[] {
  return sections.map((section) => {
    const locked = isLockedSection(section.id);
    const override = locked ? undefined : config[section.id];

    const enabled = override?.enabled ?? section.enabled;
    const contentStatus = override?.contentStatus ?? section.contentStatus;

    return {
      ...section,
      enabled,
      contentStatus,
      locked,
      isVisible: enabled && contentStatus === "live",
      isOverridden: enabled !== section.enabled || contentStatus !== section.contentStatus,
    };
  });
}

/** Herkese açık sayfada render edilecek bölümler — sıra korunur. */
export function visibleHomeSections<T extends HomeSectionMeta>(
  sections: readonly T[],
  config: HomeSectionsConfig,
): ResolvedHomeSection<T>[] {
  return resolveHomeSections(sections, config).filter((section) => section.isVisible);
}
