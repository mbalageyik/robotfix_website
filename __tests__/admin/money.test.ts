import { describe, expect, it } from "vitest";
import { formatMinorForInput, parseMoneyToMinor } from "@/lib/admin/money";

/*
  Para ayrıştırma testleri.

  EN ÖNEMLİ DAVRANIŞ: boş girdi ile sıfır AYNI ŞEY DEĞİLDİR (bilgi dosyası §6).
    ""  → null → sitede "Fiyat için iletişime geçin"
    "0" → HATA → sıfır bir fiyat değil, veri hatasıdır
  Bu ayrım kaybolursa fiyatı doğrulanmamış her ürün sitede "0,00 TL" görünür.
*/

describe("boş girdi ile sıfır ayrımı", () => {
  it("boş dize fiyatsızlığa çözülür", () => {
    expect(parseMoneyToMinor("")).toEqual({ ok: true, minor: null });
  });

  it("yalnız boşluk da fiyatsızlıktır", () => {
    expect(parseMoneyToMinor("   ")).toEqual({ ok: true, minor: null });
  });

  it("null ve undefined fiyatsızlıktır", () => {
    expect(parseMoneyToMinor(null)).toEqual({ ok: true, minor: null });
    expect(parseMoneyToMinor(undefined)).toEqual({ ok: true, minor: null });
  });

  it("sıfır REDDEDİLİR", () => {
    const result = parseMoneyToMinor("0");
    expect(result.ok).toBe(false);
  });

  it("sıfırın reddi kullanıcıya ne yapacağını söyler", () => {
    const result = parseMoneyToMinor("0,00");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // Mesaj "boş bırakın" yönlendirmesini içermeli; yoksa kullanıcı sıkışır.
      expect(result.message).toMatch(/boş/i);
    }
  });
});

describe("Türkçe ve İngilizce ondalık biçimleri", () => {
  it("tam sayı", () => {
    expect(parseMoneyToMinor("1249")).toEqual({ ok: true, minor: 124_900 });
  });

  it("virgüllü ondalık (TR)", () => {
    expect(parseMoneyToMinor("1249,90")).toEqual({ ok: true, minor: 124_990 });
  });

  it("noktalı ondalık (EN)", () => {
    expect(parseMoneyToMinor("1249.90")).toEqual({ ok: true, minor: 124_990 });
  });

  it("binlik noktası + ondalık virgül (TR)", () => {
    expect(parseMoneyToMinor("1.249,90")).toEqual({ ok: true, minor: 124_990 });
  });

  it("binlik virgülü + ondalık nokta (EN)", () => {
    expect(parseMoneyToMinor("1,249.90")).toEqual({ ok: true, minor: 124_990 });
  });

  it("tek haneli kuruş iki haneye tamamlanır", () => {
    expect(parseMoneyToMinor("10,5")).toEqual({ ok: true, minor: 1_050 });
  });

  it("üç haneli grup binlik sayılır", () => {
    expect(parseMoneyToMinor("1.249")).toEqual({ ok: true, minor: 124_900 });
  });
});

describe("reddedilen girdiler", () => {
  it("harf içeren girdi", () => {
    expect(parseMoneyToMinor("abc").ok).toBe(false);
  });

  it("para birimi simgesi", () => {
    expect(parseMoneyToMinor("1249 TL").ok).toBe(false);
  });

  it("negatif değer", () => {
    expect(parseMoneyToMinor("-5").ok).toBe(false);
  });

  it("dörtten fazla ondalık hane", () => {
    expect(parseMoneyToMinor("12,3456").ok).toBe(false);
  });
});

describe("üç haneli grup binlik ayırıcı sayılır", () => {
  /*
    "12,345" belirsizdir: TR okumasıyla 12,345 (üç ondalık hane — kuruş iki
    hanedir, geçersiz), EN okumasıyla 12345. Ayrıştırıcı BİNLİK okumayı seçer.

    Bu bilinçli bir tercihtir: yönetici üç haneli bir grup yazdığında neredeyse
    her zaman binlik kastediyordur ve alternatif davranış (hata) onu, aslında
    doğru yazdığı bir sayıyı düzeltmeye zorlardı.
  */
  it("virgülle", () => {
    expect(parseMoneyToMinor("12,345")).toEqual({ ok: true, minor: 1_234_500 });
  });

  it("noktayla", () => {
    expect(parseMoneyToMinor("12.345")).toEqual({ ok: true, minor: 1_234_500 });
  });
});

describe("forma geri yazma", () => {
  it("kuruş insan biçimine çevrilir", () => {
    expect(formatMinorForInput(124_990)).toBe("1249,90");
  });

  it("tam lira da iki haneli kuruşla yazılır", () => {
    expect(formatMinorForInput(124_900)).toBe("1249,00");
  });

  it("null boş dizeye çevrilir (0 DEĞİL)", () => {
    // "0" yazılsaydı düzenlenen her fiyatsız ürün kaydetmede hata verirdi.
    expect(formatMinorForInput(null)).toBe("");
    expect(formatMinorForInput(undefined)).toBe("");
  });

  it("gidiş-dönüş değeri korur", () => {
    for (const original of ["1249,90", "10,05", "1,00"]) {
      const parsed = parseMoneyToMinor(original);
      expect(parsed.ok).toBe(true);
      if (parsed.ok && parsed.minor !== null) {
        expect(formatMinorForInput(parsed.minor)).toBe(original.replace(/^0+(?=\d)/, ""));
      }
    }
  });
});
