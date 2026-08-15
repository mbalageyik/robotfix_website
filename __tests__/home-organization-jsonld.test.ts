import { describe, expect, it } from "vitest";
import { buildOrganizationJsonLd } from "@/lib/home/organization-jsonld";

/*
  Kuruluş yapılandırılmış verisinin DOĞRULUK sınırı.

  Buradaki testler biçim testi değildir: her biri bilgi dosyası §18/§20'deki
  bir yasağın karşılığıdır. Bir alan "makul varsayılan"la doldurulmaya
  kalkışılırsa bu dosya kırılır.
*/

const BASE = {
  siteUrl: "https://ornek.robotfix.test",
  name: "Robot Fix",
} as const;

describe("buildOrganizationJsonLd", () => {
  it("en az alanla geçerli bir Organization üretir", () => {
    const jsonLd = buildOrganizationJsonLd(BASE);

    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@type"]).toBe("Organization");
    expect(jsonLd.name).toBe("Robot Fix");
    expect(jsonLd.url).toBe(BASE.siteUrl);
  });

  it("adres yoksa address alanı HİÇ yazılmaz ve tip LocalBusiness'a yükseltilmez", () => {
    const jsonLd = buildOrganizationJsonLd({ ...BASE, addressLine: null });

    expect(jsonLd).not.toHaveProperty("address");
    expect(jsonLd["@type"]).toBe("Organization");
  });

  it("boş/boşluk adres de yok sayılır", () => {
    const jsonLd = buildOrganizationJsonLd({ ...BASE, addressLine: "   " });

    expect(jsonLd).not.toHaveProperty("address");
    expect(jsonLd["@type"]).toBe("Organization");
  });

  it("adres doğrulanmışsa LocalBusiness olur ve adres serbest metin kalır", () => {
    const jsonLd = buildOrganizationJsonLd({
      ...BASE,
      addressLine: "Örnek Mahallesi, Örnek Sokak No: 1, Gaziantep",
    });

    expect(jsonLd["@type"]).toBe("LocalBusiness");
    expect(jsonLd.address).toEqual({
      "@type": "PostalAddress",
      streetAddress: "Örnek Mahallesi, Örnek Sokak No: 1, Gaziantep",
      addressCountry: "TR",
    });
  });

  it("adresi il/ilçe alanlarına AYRIŞTIRMAZ (tahmin yok)", () => {
    const jsonLd = buildOrganizationJsonLd({
      ...BASE,
      addressLine: "Örnek Mahallesi, Örnek Sokak No: 1, Şehitkamil / Gaziantep",
    });
    const address = jsonLd.address as Record<string, unknown>;

    expect(address).not.toHaveProperty("addressLocality");
    expect(address).not.toHaveProperty("addressRegion");
    expect(address).not.toHaveProperty("postalCode");
  });

  it("çalışma saati serbest metni openingHours'a ÇEVRİLMEZ", () => {
    // Girdi tipinde böyle bir alan yoktur; çıktıda da bulunmamalıdır.
    const jsonLd = buildOrganizationJsonLd({
      ...BASE,
      addressLine: "Örnek Mahallesi, Gaziantep",
    });

    expect(jsonLd).not.toHaveProperty("openingHours");
    expect(jsonLd).not.toHaveProperty("openingHoursSpecification");
  });

  it("puan, yorum ve sertifika alanları ASLA üretilmez", () => {
    const jsonLd = buildOrganizationJsonLd({
      ...BASE,
      addressLine: "Örnek Mahallesi, Gaziantep",
      phone: "+900000000000",
      storeUrls: ["https://ornek-magaza.test/robotfix"],
    });

    for (const forbidden of [
      "aggregateRating",
      "review",
      "hasCredential",
      "award",
      "makesOffer",
      "priceRange",
    ]) {
      expect(jsonLd, `${forbidden} doğrulanmamış bir iddiadır`).not.toHaveProperty(forbidden);
    }
  });

  it("telefon yoksa telephone alanı yazılmaz", () => {
    expect(buildOrganizationJsonLd({ ...BASE, phone: null })).not.toHaveProperty("telephone");
  });

  it("mağaza bağlantısı yoksa sameAs yazılmaz", () => {
    expect(buildOrganizationJsonLd({ ...BASE, storeUrls: [] })).not.toHaveProperty("sameAs");
  });

  it("doğrulanmış mağaza bağlantıları sameAs olur", () => {
    const jsonLd = buildOrganizationJsonLd({
      ...BASE,
      storeUrls: ["https://ornek-magaza.test/a", "https://ornek-magaza.test/b"],
    });

    expect(jsonLd.sameAs).toEqual(["https://ornek-magaza.test/a", "https://ornek-magaza.test/b"]);
  });

  it("JSON'a serileşebilir (undefined alan bırakmaz)", () => {
    const jsonLd = buildOrganizationJsonLd({ ...BASE, addressLine: null, phone: null });

    expect(() => JSON.stringify(jsonLd)).not.toThrow();
    expect(JSON.stringify(jsonLd)).not.toContain("undefined");
  });
});
