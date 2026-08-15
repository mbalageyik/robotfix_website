import { getPublicClient } from "@/lib/supabase/public-client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fail, ok, type DataResult } from "@/lib/data/result";
import {
  EMPTY_HOME_SECTIONS_CONFIG,
  HOMEPAGE_SECTIONS_SETTING_KEY,
  parseHomeSectionsConfig,
  type HomeSectionsConfig,
} from "@/lib/home/section-registry";

/*
  Site ayarları (bilgi dosyası §17).

  Bu tablo anonim role TAMAMEN okunabilirdir; bu yüzden SIR SAKLANMAZ —
  yalnız herkese açık işletme bilgisi bulunur. Kural şemada da yazılıdır
  (site_settings tablo yorumu).
*/

/**
 * SİTE AYARLARI FORMUNUN anahtarları. Serbest metin değil — yazım hatası
 * typecheck'te yakalanır.
 *
 * DİKKAT: bu liste `saveSiteSettingsAction` tarafından her kaydedişte TOPLU
 * yazılır. Formun alanı olmayan bir anahtar buraya EKLENMEZ; eklenirse ayar
 * formu o değeri her kaydedişte boşaltır. Ana sayfa bölüm yapılandırması bu
 * yüzden ayrı tutulur (`HOMEPAGE_SECTIONS_SETTING_KEY`).
 */
export const SITE_SETTING_KEYS = [
  "whatsapp_phone",
  "phone_display",
  "address_line",
  "working_hours",
  "maps_url",
  "store_amazon_url",
  "store_hepsiburada_url",
  "store_trendyol_url",
  "store_pazarama_url",
  "whatsapp_template_product",
  "whatsapp_template_service",
] as const;

export type SiteSettingKey = (typeof SITE_SETTING_KEYS)[number];

/** Anahtar → değer. Değeri girilmemiş ayar `null` olur. */
export type SiteSettings = Record<SiteSettingKey, string | null>;

const EMPTY_SETTINGS: SiteSettings = Object.fromEntries(
  SITE_SETTING_KEYS.map((key) => [key, null]),
) as SiteSettings;

/**
 * Tüm site ayarlarını okur.
 *
 * Tabloda olmayan anahtarlar `null` gelir — çağıran taraf her anahtarın var
 * olduğuna güvenebilir. Boş dize de `null`'a normalize edilir ki
 * "girilmemiş" ile "boş girilmiş" aynı şekilde ele alınsın.
 */
export async function getSiteSettings(): Promise<DataResult<SiteSettings>> {
  if (!isSupabaseConfigured) {
    return fail("not_configured", "Supabase yapılandırılmamış.");
  }

  const { data, error } = await getPublicClient().from("site_settings").select("key, value");

  if (error) return fail("query_failed", error.message, error.code);

  const settings: SiteSettings = { ...EMPTY_SETTINGS };
  for (const row of data) {
    if ((SITE_SETTING_KEYS as readonly string[]).includes(row.key)) {
      const value = row.value?.trim();
      settings[row.key as SiteSettingKey] = value ? value : null;
    }
  }

  return ok(settings);
}

/**
 * Ana sayfa bölüm yapılandırmasını okur.
 *
 * `getSiteSettings()` ile AYRI TUTULUR: o fonksiyon ayar formunun anahtarlarını
 * `string | null` olarak döner, buradaki değer ise JSON'dur ve kendi
 * doğrulamasına sahiptir. Ayrıca ana sayfa yalnız bu anahtarı okur — tüm ayar
 * tablosunu çekip birini kullanmak gereksiz olurdu.
 *
 * ASLA HATA FIRLATMAZ ve `DataResult` DÖNMEZ: çağıran taraf için "okunamadı"
 * ile "boş" arasında bir fark yoktur, ikisinde de kod içi varsayılanlar
 * geçerlidir. Bir ayar okuması yüzünden ana sayfa düşmemelidir.
 */
export async function getHomeSectionsConfig(): Promise<HomeSectionsConfig> {
  if (!isSupabaseConfigured) return EMPTY_HOME_SECTIONS_CONFIG;

  const { data, error } = await getPublicClient()
    .from("site_settings")
    .select("value")
    .eq("key", HOMEPAGE_SECTIONS_SETTING_KEY)
    .maybeSingle();

  if (error) {
    console.error(`[site-settings] bölüm yapılandırması okunamadı: ${error.message}`);
    return EMPTY_HOME_SECTIONS_CONFIG;
  }

  return parseHomeSectionsConfig(data?.value ?? null);
}
