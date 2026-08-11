import { describe, expect, it } from "vitest";
import {
  InvalidPhoneNumberError,
  buildProductMessage,
  buildServiceMessage,
  buildWhatsAppUrl,
  normalizePhone,
  toWaMeNumber,
} from "@/lib/whatsapp";

/*
  Bu testlerdeki numaralar SABİT KODLANMIŞ İŞLETME NUMARASI DEĞİLDİR; yalnızca
  ayrıştırma kurallarını doğrulayan örneklerdir. Gerçek numara env'den gelir.
*/
const SAMPLE_LOCAL = "0532 000 00 00";
const SAMPLE_E164 = "+905320000000";

describe("normalizePhone", () => {
  it.each([
    ["yerel boşluklu", SAMPLE_LOCAL],
    ["yerel tireli", "0532-000-00-00"],
    ["parantezli", "(0532) 000 00 00"],
    ["noktalı", "0532.000.00.00"],
    ["uluslararası artılı", "+90 532 000 00 00"],
    ["uluslararası 00 önekli", "0090 532 000 00 00"],
    ["öneksiz 12 hane", "905320000000"],
    ["öneksiz abone", "5320000000"],
  ])("%s biçimi E.164'e çevrilir", (_label, input) => {
    expect(normalizePhone(input)).toBe(SAMPLE_E164);
  });

  it("zaten E.164 olan girdiyi değiştirmez", () => {
    expect(normalizePhone(SAMPLE_E164)).toBe(SAMPLE_E164);
  });

  it.each([
    ["boş dize", ""],
    ["yalnız boşluk", "   "],
    ["harf içeren", "0532 ABC 00 00"],
    ["çok kısa", "0532 000"],
    ["çok uzun", "0532 000 00 00 11"],
    ["sabit hat (5 ile başlamıyor)", "0342 000 00 00"],
    ["rakamsız", "+-()"],
  ])("%s girdisinde hata fırlatır", (_label, input) => {
    expect(() => normalizePhone(input)).toThrow(InvalidPhoneNumberError);
  });

  it("hata mesajı sessizce yutulmaz, sebebi taşır", () => {
    expect(() => normalizePhone("0342 000 00 00")).toThrow(/TR mobil numarası değil/);
  });
});

describe("toWaMeNumber", () => {
  it("artı işaretini kaldırır", () => {
    expect(toWaMeNumber(SAMPLE_LOCAL)).toBe("905320000000");
  });
});

describe("buildWhatsAppUrl", () => {
  it("mesajsız bağlantı kurar", () => {
    expect(buildWhatsAppUrl({ phone: SAMPLE_LOCAL })).toBe("https://wa.me/905320000000");
  });

  it("Türkçe karakterleri doğru kodlar", () => {
    const url = buildWhatsAppUrl({ phone: SAMPLE_E164, message: "Fırça değişimi ışığı söndü" });
    // Ham Türkçe karakter URL'de kalmamalı; UTF-8 yüzde kodlaması olmalı.
    expect(url).not.toMatch(/[ışğüçöİŞĞÜÇÖ]/);
    expect(url).toContain("F%C4%B1r%C3%A7a");
    expect(decodeURIComponent(url.split("?text=")[1])).toBe("Fırça değişimi ışığı söndü");
  });

  it("satır sonlarını %0A olarak kodlar", () => {
    const url = buildWhatsAppUrl({ phone: SAMPLE_E164, message: "Bir\nİki" });
    expect(url).toContain("%0A");
    expect(url).not.toContain("\n");
  });

  it("& ve ? gibi sorgu kırıcı karakterleri kaçırır", () => {
    const url = buildWhatsAppUrl({ phone: SAMPLE_E164, message: "fırça & motor?" });
    expect(url.split("?").length).toBe(2);
    expect(url).toContain("%26");
  });

  it("geçersiz numarada bağlantı üretmez", () => {
    expect(() => buildWhatsAppUrl({ phone: "0342 000 00 00" })).toThrow(InvalidPhoneNumberError);
  });
});

describe("buildProductMessage", () => {
  it("tüm alanlar doluyken beklenen çıktıyı verir", () => {
    expect(
      buildProductMessage({
        productName: "Ana Fırça Modülü",
        brand: "Roborock",
        sku: "RF-101",
        price: "1.249,00 TL",
        url: "https://robotfix.com.tr/urunler/ana-firca-modulu",
      }),
    ).toBe(
      [
        "Merhaba Robot Fix,",
        '"Ana Fırça Modülü" hakkında bilgi almak ve sipariş durumunu öğrenmek istiyorum.',
        "Marka: Roborock",
        "Ürün kodu: RF-101",
        "Gösterilen fiyat: 1.249,00 TL",
        "Ürün bağlantısı: https://robotfix.com.tr/urunler/ana-firca-modulu",
      ].join("\n"),
    );
  });

  it("fiyat yoksa fiyat satırını tümüyle çıkarır", () => {
    const message = buildProductMessage({ productName: "Ana Fırça Modülü", sku: "RF-101" });
    expect(message).not.toContain("Gösterilen fiyat");
    expect(message).not.toContain("undefined");
    expect(message).not.toContain("null");
    expect(message).toContain("Ürün kodu: RF-101");
  });

  it.each([undefined, null, "", "   "])("fiyat %o iken boş satır bırakmaz", (price) => {
    const message = buildProductMessage({ productName: "Ana Fırça Modülü", price });
    expect(message.split("\n").some((line) => line.trim() === "")).toBe(false);
    expect(message).not.toMatch(/fiyat:\s*$/im);
  });

  it("ürün adı boşsa hata fırlatır", () => {
    expect(() => buildProductMessage({ productName: "  " })).toThrow(/productName zorunludur/);
  });
});

describe("buildServiceMessage", () => {
  it("bağlam yokken müşterinin dolduracağı alanları bırakır", () => {
    expect(buildServiceMessage()).toBe(
      [
        "Merhaba Robot Fix,",
        "Robot süpürgem için teknik servis desteği almak istiyorum.",
        "Marka/model: …",
        "Yaşadığım sorun: …",
      ].join("\n"),
    );
  });

  it("bilinen marka ve modeli birleştirir", () => {
    const message = buildServiceMessage({ brand: "Xiaomi", model: "S10", issue: "şarj olmuyor" });
    expect(message).toContain("Marka/model: Xiaomi S10");
    expect(message).toContain("Yaşadığım sorun: şarj olmuyor");
    expect(message).not.toContain("…");
  });

  it("yalnız marka biliniyorsa modeli uydurmaz", () => {
    expect(buildServiceMessage({ brand: "Xiaomi" })).toContain("Marka/model: Xiaomi");
  });
});
