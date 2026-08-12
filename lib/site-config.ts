/*
  Site ayarlarının TEK kaynağı.

  İKİ KATMANLI ÇÖZÜM (bilgi dosyası §8, §17):

    1. Aşağıdaki SENKRON dışa aktarımlar env'den beslenir ve VARSAYILAN /
       YEDEK katmandır. Modül seviyesinde çözüldükleri için her bağlamda
       (istemci dâhil) kullanılabilirler.

    2. `getSiteConfig()` ASENKRON çözücü `site_settings` tablosunu okur ve
       env değerlerinin ÜZERİNE yazar. Veritabanı yapılandırılmamışsa veya
       değer boşsa sessizce env'e düşer.

  Tüketici bileşenler değişmedi: WhatsAppButton artık bir async sunucu
  bileşenidir ve içeride `getSiteConfig()` çağırır; prop sözleşmesi aynıdır.
*/
import { getSiteSettings } from "@/lib/data/site-settings";
import { InvalidPhoneNumberError, normalizePhone } from "@/lib/whatsapp";

/** Env'den gelen ham değer; boş olabilir. */
const rawWhatsAppPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "";

/**
 * E.164 biçiminde WhatsApp numarası, yapılandırılmamışsa `null`.
 *
 * `null` olduğunda WhatsApp CTA'ları render EDİLMEZ — bozuk bir wa.me
 * bağlantısı göstermektense hiç göstermemek doğrudur.
 *
 * TODO(business): numara işletme tarafından DOĞRULANACAK. Şu anki değer eski
 * siteden alınmış bir varsayımdır (bilgi dosyası §10).
 */
export const whatsappPhone: string | null = (() => {
  const value = rawWhatsAppPhone.trim();
  if (!value) return null;

  try {
    return normalizePhone(value);
  } catch (error) {
    if (error instanceof InvalidPhoneNumberError) {
      // Yapılandırma hatası build'i düşürmemeli; CTA'lar sessizce gizlenir.
      console.error(`[site-config] NEXT_PUBLIC_WHATSAPP_PHONE okunamadı: ${error.message}`);
      return null;
    }
    throw error;
  }
})();

/** WhatsApp CTA'larının gösterilip gösterilmeyeceği. */
export const isWhatsAppConfigured = whatsappPhone !== null;

/** Sitenin kanonik adresi — metadata, canonical ve mutlak ürün URL'leri için. */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * WhatsApp CTA metinleri. Bilgi dosyası §15: buton metninde eylem AÇIKÇA
 * yazmalı; yalnız renge veya simgeye güvenilmez.
 */
export const whatsappCtaLabels = {
  // Türkçe mikro-tipografi: kesme işareti tipografik (U+2019), düz tırnak değil.
  productInfo: "WhatsApp’tan Bilgi Al",
  productOrder: "WhatsApp’tan Sipariş Sor",
  service: "Servis Talebi Oluştur",
} as const;

export type WhatsAppCtaLabel = (typeof whatsappCtaLabels)[keyof typeof whatsappCtaLabels];

// ---------------------------------------------------------------------------
// Veritabanından beslenen çözülmüş yapılandırma
// ---------------------------------------------------------------------------

export interface ResolvedSiteConfig {
  /** E.164 numara; hiçbir kaynakta yoksa `null` → CTA render edilmez. */
  whatsappPhone: string | null;
  isWhatsAppConfigured: boolean;
  phoneDisplay: string | null;
  addressLine: string | null;
  workingHours: string | null;
  mapsUrl: string | null;
  /** Doğrulanmış pazaryeri MAĞAZA bağlantıları. Boş olanlar hiç yer almaz. */
  storeLinks: { marketplace: string; label: string; url: string }[];
  /** Değerin nereden geldiği — `/veri-kontrol` bunu gösterir. */
  source: "database" | "env";
}

/** Ham bir numarayı güvenle E.164'e çevirir; olmuyorsa `null`. */
function safeNormalize(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    return normalizePhone(trimmed);
  } catch (error) {
    if (error instanceof InvalidPhoneNumberError) {
      console.error(`[site-config] numara okunamadı: ${error.message}`);
      return null;
    }
    throw error;
  }
}

const STORE_LINK_KEYS = [
  { key: "store_amazon_url", marketplace: "amazon", label: "Amazon" },
  { key: "store_hepsiburada_url", marketplace: "hepsiburada", label: "Hepsiburada" },
  { key: "store_trendyol_url", marketplace: "trendyol", label: "Trendyol" },
  { key: "store_pazarama_url", marketplace: "pazarama", label: "Pazarama" },
] as const;

/**
 * Site ayarlarını veritabanından okur, env'i yedek olarak kullanır.
 *
 * Asla hata fırlatmaz: veritabanı erişilemezse env katmanına düşer ve
 * `source: "env"` döner. Site ayarları yüzünden sayfa düşmemelidir.
 */
export async function getSiteConfig(): Promise<ResolvedSiteConfig> {
  const result = await getSiteSettings();

  if (!result.ok) {
    return {
      whatsappPhone,
      isWhatsAppConfigured,
      phoneDisplay: null,
      addressLine: null,
      workingHours: null,
      mapsUrl: null,
      storeLinks: [],
      source: "env",
    };
  }

  const settings = result.data;
  // Veritabanı değeri önce; yoksa env varsayımı.
  const resolvedPhone = safeNormalize(settings.whatsapp_phone) ?? whatsappPhone;

  return {
    whatsappPhone: resolvedPhone,
    isWhatsAppConfigured: resolvedPhone !== null,
    phoneDisplay: settings.phone_display,
    addressLine: settings.address_line,
    workingHours: settings.working_hours,
    mapsUrl: settings.maps_url,
    // Bilgi dosyası §9: bağlantı yoksa o pazaryerinin butonu HİÇ gösterilmez.
    storeLinks: STORE_LINK_KEYS.flatMap(({ key, marketplace, label }) => {
      const url = settings[key];
      return url ? [{ marketplace, label, url }] : [];
    }),
    source: settings.whatsapp_phone ? "database" : "env",
  };
}
