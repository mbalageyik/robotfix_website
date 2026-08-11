/*
  Site ayarlarının TEK kaynağı.

  Bilgi dosyası §8: "Bu numara ... kod içinde sabitlenmek yerine site
  ayarlarından yönetilebilmelidir." Bu yüzden numara koda gömülmez; env'den
  okunur. Faz 3'te aynı arayüz `site_settings` tablosundan beslenecek —
  tüketiciler (bileşenler) değişmeyecek.
*/
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
