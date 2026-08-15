/*
  WhatsApp dönüşüm motoru — saf ve test edilebilir fonksiyonlar.

  Bu dosya env okumaz, React bilmez, yan etkisi yoktur. Numara ve varsayılan
  şablon ayarları `lib/site-config.ts` üzerinden gelir; ileride yönetim
  panelinden (site_settings tablosu) beslenecek tek nokta orasıdır.

  Bilgi dosyası §8 kuralları:
  - Bağlantılar güvenli biçimde URL kodlamasıyla kurulur.
  - Fiyat bulunmuyorsa mesajda boş veya hatalı bir değer GÖSTERİLMEZ.
*/

/** Numara ayrıştırılamadığında atılır. Sessizce bozuk bağlantı üretmeyiz. */
export class InvalidPhoneNumberError extends Error {
  constructor(input: string, reason: string) {
    super(`Geçersiz telefon numarası (${reason}): ${JSON.stringify(input)}`);
    this.name = "InvalidPhoneNumberError";
  }
}

/** Türkiye ülke kodu; yerel biçimler bu kodla E.164'e tamamlanır. */
const DEFAULT_COUNTRY_CODE = "90";

/** TR mobil abone numarası: 5 ile başlayan 10 hane. */
const TR_SUBSCRIBER_PATTERN = /^5\d{9}$/;

/**
 * Yerel veya uluslararası biçimdeki bir numarayı E.164'e çevirir.
 *
 * Kabul edilen biçimler — boşluk, tire, nokta ve parantez yok sayılır:
 * - yerel: `0` + 10 hane
 * - uluslararası: `+90`/`0090`/`90` + 10 hane
 * - öneksiz: 10 hane
 *
 * Abone numarası `5` ile başlamalı ve 10 haneli olmalıdır (TR mobil).
 * Somut biçim örnekleri için `__tests__/whatsapp.test.ts`'e bakın — bu dosyada
 * bilinçli olarak telefon numarası ÖRNEĞİ YAZILMAZ, çünkü numara yalnız
 * env'den okunur (bkz. `lib/site-config.ts`, bilgi dosyası §8).
 *
 * @throws {InvalidPhoneNumberError} girdi boşsa, harf içeriyorsa veya
 *   geçerli bir TR mobil numarasına çözülemiyorsa.
 */
export function normalizePhone(input: string, countryCode = DEFAULT_COUNTRY_CODE): string {
  if (typeof input !== "string" || input.trim() === "") {
    throw new InvalidPhoneNumberError(String(input), "boş girdi");
  }

  // Yalnız rakam, artı ve yaygın ayırıcılara izin ver; harf varsa reddet.
  if (/[^\d+\s\-().]/.test(input)) {
    throw new InvalidPhoneNumberError(input, "beklenmeyen karakter");
  }

  const hasPlus = input.trim().startsWith("+");
  let digits = input.replace(/\D/g, "");

  if (digits === "") {
    throw new InvalidPhoneNumberError(input, "rakam yok");
  }

  // Uluslararası çıkış öneki: 00 → +
  if (!hasPlus && digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  let subscriber: string;

  if (digits.startsWith(countryCode) && digits.length === countryCode.length + 10) {
    // 90 + 10 hane
    subscriber = digits.slice(countryCode.length);
  } else if (digits.startsWith("0") && digits.length === 11) {
    // Yerel: 0 + 10 hane
    subscriber = digits.slice(1);
  } else if (digits.length === 10) {
    // Öneksiz abone numarası
    subscriber = digits;
  } else {
    throw new InvalidPhoneNumberError(input, `beklenmeyen uzunluk (${digits.length} hane)`);
  }

  if (!TR_SUBSCRIBER_PATTERN.test(subscriber)) {
    throw new InvalidPhoneNumberError(input, "geçerli bir TR mobil numarası değil");
  }

  return `+${countryCode}${subscriber}`;
}

/** wa.me yolu için E.164 numarasının `+`sız hâli. */
export function toWaMeNumber(phone: string): string {
  return normalizePhone(phone).slice(1);
}

/**
 * wa.me bağlantısını kurar. Mesaj `encodeURIComponent` ile kodlanır; Türkçe
 * karakterler ve satır sonları (`\n` → `%0A`) doğru aktarılır.
 */
export function buildWhatsAppUrl({ phone, message }: { phone: string; message?: string }): string {
  const number = toWaMeNumber(phone);
  const text = message?.trim();
  return text
    ? `https://wa.me/${number}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${number}`;
}

/** Boş/whitespace satırları eleyerek mesaj gövdesi kurar. */
function composeLines(lines: (string | null | undefined | false)[]): string {
  return lines
    .filter((line): line is string => typeof line === "string" && line.trim() !== "")
    .join("\n");
}

// ---------------------------------------------------------------------------
// Yönetici şablonları (bilgi dosyası §8, §17)
// ---------------------------------------------------------------------------
/*
  Şablonlar `site_settings.whatsapp_template_product` / `_service` alanlarından
  gelir ve YÖNETİCİ tarafından yazılır.

  BU DOSYA ŞABLONU KENDİ OKUMAZ — saf kalır (env yok, ağ yok, React yok).
  Çözümleme `lib/site-config.ts` içindedir; şablon buraya bir ARGÜMAN olarak
  girer. Böylece davranış doğrudan test edilebilir kalır.

  YER TUTUCU SÖZLEŞMESİ (§8'deki adlarla):
    ürün   → [ÜRÜN ADI] [MARKA] [ÜRÜN KODU] [FİYAT] [ÜRÜN URL]
    servis → [MARKA/MODEL] [SORUN]

  DEĞERİ OLMAYAN YER TUTUCU — İKİ FARKLI KURAL, İKİSİ DE BİLİNÇLİ:

  1. ÜRÜN mesajında değeri olmayan yer tutucunun bulunduğu SATIR tümüyle
     çıkarılır. Gerekçe §8: "Fiyat bulunmuyorsa mesajda boş veya hatalı bir
     değer gösterilmemelidir." Satır birimi seçildi çünkü cümle birimi
     Türkçede güvenilir değildir: fiyat metninin kendisi nokta içerir
     ("1.249,00 TL") ve cümleye göre bölmek mesajı ortasından keserdi.
     Bu kural, şablonsuz varsayılan mesajın davranışının aynısıdır.

  2. SERVİS mesajında değeri olmayan yer tutucu SATIRI SİLMEZ; müşterinin
     dolduracağı işaretle (…) değiştirir. Çünkü o alanlar zaten müşteriden
     beklenir — satırı silmek soruyu hiç sormamak olurdu.

  TANINMAYAN YER TUTUCU olduğu gibi bırakılır. Yöneticinin yazdığı metni
  sessizce silmeyiz; görünür kalması sorunun fark edilmesini sağlar.
*/

type TemplateValues = Record<string, string | null>;

/**
 * Şablondaki yer tutucuları değerlerle değiştirir.
 *
 * @param onMissing `"drop-line"` → değeri olmayan yer tutucunun satırı silinir.
 *                  Aksi hâlde verilen yedek metin yazılır.
 */
function renderTemplate(
  template: string,
  values: TemplateValues,
  onMissing: "drop-line" | { fallback: string },
): string {
  const lines = template.split(/\r?\n/).map((line) => {
    let dropLine = false;

    const rendered = line.replaceAll(/\[([^\]]+)\]/g, (match, rawToken: string) => {
      const token = `[${rawToken.trim().toUpperCase()}]`;

      // Sözlükte olmayan yer tutucu: dokunmadan bırak.
      if (!(token in values)) return match;

      const value = values[token]?.trim();
      if (value) return value;

      if (onMissing === "drop-line") {
        dropLine = true;
        return "";
      }
      return onMissing.fallback;
    });

    return dropLine ? null : rendered;
  });

  return composeLines(lines);
}

/** Şablon girilmemişse (boş/boşluk) varsayılana düşülür. */
function usableTemplate(template: string | null | undefined): string | null {
  const trimmed = template?.trim();
  return trimmed ? trimmed : null;
}

export interface ProductMessageInput {
  /** Ürün adı — zorunlu; mesajın konusudur. */
  productName: string;
  brand?: string | null;
  /** Ürün veya stok kodu. */
  sku?: string | null;
  /**
   * Sitede GÖSTERİLEN fiyat metni (ör. "1.249,00 TL").
   * Yoksa fiyat satırı tümüyle çıkarılır — asla boş/undefined basılmaz.
   */
  price?: string | null;
  /** Ürünün mutlak URL'i. */
  url?: string | null;
}

/**
 * Ürün mesajı (bilgi dosyası §8). Eksik alanların satırı hiç yazılmaz.
 *
 * @example
 * buildProductMessage({ productName: "Ana Fırça", sku: "RF-101" })
 * // Merhaba Robot Fix,
 * // "Ana Fırça" hakkında bilgi almak ve sipariş durumunu öğrenmek istiyorum.
 * // Ürün kodu: RF-101
 */
export function buildProductMessage(input: ProductMessageInput, template?: string | null): string {
  const name = input.productName?.trim();
  if (!name) {
    throw new Error("buildProductMessage: productName zorunludur.");
  }

  const custom = usableTemplate(template);
  if (custom) {
    return renderTemplate(
      custom,
      {
        "[ÜRÜN ADI]": name,
        "[MARKA]": input.brand ?? null,
        "[ÜRÜN KODU]": input.sku ?? null,
        "[FİYAT]": input.price ?? null,
        "[ÜRÜN URL]": input.url ?? null,
      },
      // Fiyatı olmayan üründe fiyat satırı hiç yazılmaz (§8).
      "drop-line",
    );
  }

  return composeLines([
    "Merhaba Robot Fix,",
    `"${name}" hakkında bilgi almak ve sipariş durumunu öğrenmek istiyorum.`,
    input.brand?.trim() && `Marka: ${input.brand.trim()}`,
    input.sku?.trim() && `Ürün kodu: ${input.sku.trim()}`,
    input.price?.trim() && `Gösterilen fiyat: ${input.price.trim()}`,
    input.url?.trim() && `Ürün bağlantısı: ${input.url.trim()}`,
  ]);
}

export interface ServiceMessageInput {
  /** Biliniyorsa marka (ör. marka sayfasından gelen bağlam). */
  brand?: string | null;
  model?: string | null;
  /** Biliniyorsa arıza ifadesi (ör. arıza seçiciden). */
  issue?: string | null;
}

/** Müşterinin dolduracağı alanlar için yer tutucu. */
const CUSTOMER_FILLS = "…";

/**
 * Servis mesajı (bilgi dosyası §8). Bilinen bağlam doldurulur; bilinmeyen
 * alanlar müşterinin tamamlaması için yer tutucuyla bırakılır.
 */
export function buildServiceMessage(
  input: ServiceMessageInput = {},
  template?: string | null,
): string {
  const device = [input.brand?.trim(), input.model?.trim()].filter(Boolean).join(" ");

  const custom = usableTemplate(template);
  if (custom) {
    return renderTemplate(
      custom,
      { "[MARKA/MODEL]": device || null, "[SORUN]": input.issue ?? null },
      // Servis alanlarını müşteri doldurur; satır SİLİNMEZ (yukarıdaki 2. kural).
      { fallback: CUSTOMER_FILLS },
    );
  }

  return composeLines([
    "Merhaba Robot Fix,",
    "Robot süpürgem için teknik servis desteği almak istiyorum.",
    `Marka/model: ${device || CUSTOMER_FILLS}`,
    `Yaşadığım sorun: ${input.issue?.trim() || CUSTOMER_FILLS}`,
  ]);
}
