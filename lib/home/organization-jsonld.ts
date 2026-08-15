/*
  Kuruluş / yerel işletme yapılandırılmış verisi (schema.org).

  DOĞRULUK KURALI (bilgi dosyası §18, §20 + CLAUDE.md):
  Yapılandırılmış veri, sayfada GERÇEKTEN görünen ve DOĞRULANMIŞ bilgiyi
  yansıtır. Bu dosyada hiçbir alan tahmin edilmez:

  - `aggregateRating`, `review` ASLA üretilmez — doğrulanmış müşteri kanıtımız
    yok (§20). Sayısal başarı iddiası da yok.
  - `openingHours` ÜRETİLMEZ. `site_settings.working_hours` SERBEST METİNDİR
    (ör. "Hafta içi 09.00–18.00"); schema.org ise makine biçimi bekler
    ("Mo-Fr 09:00-18:00"). Serbest metni bu biçime çevirmek, hangi günlerin
    kastedildiğini TAHMİN etmek olurdu. Çalışma saati sayfada metin olarak
    gösterilir; yapılandırılmış veriye yalnız işletme makine-okunur biçimi
    onayladığında girer.
  - Adres yoksa `address` bloğu hiç yazılmaz ve tip `LocalBusiness`e
    YÜKSELTİLMEZ: adressiz bir yerel işletme kaydı, arama motoruna
    doğrulayamayacağımız bir yerellik sinyali verirdi.

  Saf fonksiyondur — React, env veya ağ bilmez; doğrudan test edilir
  (`__tests__/home-organization-jsonld.test.ts`).
*/

export interface OrganizationJsonLdInput {
  /** Sitenin kanonik adresi. */
  siteUrl: string;
  /** Marka adı — HER ZAMAN iki kelime: "Robot Fix" (CLAUDE.md). */
  name: string;
  /** Kısa tanım; yoksa alan yazılmaz. */
  description?: string | null;
  /** `site_settings.address_line`; yoksa `null`. */
  addressLine?: string | null;
  /** E.164 telefon; yoksa `null`. */
  phone?: string | null;
  /** Doğrulanmış pazaryeri MAĞAZA bağlantıları — `sameAs` olur. */
  storeUrls?: readonly string[];
  /** Logonun mutlak URL'i; yoksa alan yazılmaz. */
  logoUrl?: string | null;
}

export function buildOrganizationJsonLd({
  siteUrl,
  name,
  description,
  addressLine,
  phone,
  storeUrls = [],
  logoUrl,
}: OrganizationJsonLdInput) {
  const hasAddress = Boolean(addressLine?.trim());

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    /*
      Adres doğrulanmışsa işletme YEREL bir işletmedir ve öyle bildirilir.
      Adres yoksa yalnız `Organization` kalır — yerellik iddiası kurulmaz.
    */
    "@type": hasAddress ? "LocalBusiness" : "Organization",
    name,
    url: siteUrl,
  };

  if (description?.trim()) jsonLd.description = description.trim();
  if (logoUrl?.trim()) jsonLd.logo = logoUrl.trim();

  if (hasAddress) {
    /*
      `streetAddress` serbest metindir; il/ilçe ayrıştırması YAPILMAZ.
      "Sarıgüllük, ... Şehitkamil / Gaziantep" gibi tek satırı parçalara
      bölmek, hangi parçanın ilçe hangisinin il olduğunu tahmin etmek olurdu.
      Ülke kodu tek güvenli sabittir (işletme Türkiye'dedir, §10).
    */
    jsonLd.address = {
      "@type": "PostalAddress",
      streetAddress: addressLine!.trim(),
      addressCountry: "TR",
    };
  }

  if (phone?.trim()) jsonLd.telephone = phone.trim();

  const sameAs = storeUrls.map((url) => url.trim()).filter(Boolean);
  if (sameAs.length > 0) jsonLd.sameAs = sameAs;

  return jsonLd;
}
