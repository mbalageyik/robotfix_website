/*
  Para girişi ↔ kuruş dönüşümü.

  Şema fiyatı kuruş cinsinden `bigint` tutar (gerekçe: design-decisions §8).
  İnsan ise "1.249,00" yazar. Bu dosya iki dünyayı bağlar ve saf kalır —
  env okumaz, React bilmez, test edilebilir.

  EN ÖNEMLİ KURAL: boş girdi ile sıfır AYNI ŞEY DEĞİLDİR.
    ""  → null → "Fiyat için iletişime geçin"
    "0" → HATA → sıfır bir fiyat değil, veri hatasıdır (bilgi dosyası §6)
  Şemada da `price_minor > 0` kısıtı vardır; bu, kullanıcıya anlaşılır mesaj
  verebilmek için uygulama tarafındaki karşılığıdır.
*/

/** Para ayrıştırılamadığında sebebi taşıyan sonuç. */
export type MoneyParseResult =
  | { ok: true; minor: number | null }
  | { ok: false; message: string };

/**
 * Türkçe veya İngilizce ondalık biçimindeki tutarı kuruşa çevirir.
 *
 * Kabul edilen: "1249", "1249,90", "1249.90", "1.249,90", "1,249.90", " " (boş)
 * Reddedilen: "0", "-5", "abc", "1,2,3"
 */
export function parseMoneyToMinor(raw: string | null | undefined): MoneyParseResult {
  const input = (raw ?? "").trim();

  // Boş = fiyat girilmemiş. Meşru ve yaygın durum.
  if (input === "") return { ok: true, minor: null };

  if (/[^\d.,\s-]/.test(input)) {
    return { ok: false, message: "Fiyat yalnız rakam, nokta ve virgül içerebilir." };
  }

  if (input.includes("-")) {
    return { ok: false, message: "Fiyat negatif olamaz." };
  }

  /*
    Ayırıcı belirleme: son geçen `,` veya `.` ondalık ayırıcıdır, öncekiler
    binlik ayırıcıdır. "1.249,90" ve "1,249.90" böylece ikisi de doğru okunur.
  */
  const lastComma = input.lastIndexOf(",");
  const lastDot = input.lastIndexOf(".");
  const decimalPos = Math.max(lastComma, lastDot);

  let integerPart: string;
  let fractionPart: string;

  if (decimalPos === -1) {
    integerPart = input.replace(/\D/g, "");
    fractionPart = "";
  } else {
    const decimalSep = input[decimalPos];
    integerPart = input.slice(0, decimalPos).replace(/\D/g, "");
    fractionPart = input.slice(decimalPos + 1).replace(/\D/g, "");

    // Ondalık ayırıcıdan sonra 3+ hane varsa aslında binlik ayırıcıdır:
    // "1.249" → 1249, "1,249" → 1249. Kuruş 2 hanedir.
    if (fractionPart.length > 2) {
      const sameSepCount = input.split(decimalSep).length - 1;
      // "1.249.000" gibi tekrar eden ayırıcı → tamamı binlik.
      if (sameSepCount >= 1 && fractionPart.length === 3) {
        integerPart += fractionPart;
        fractionPart = "";
      } else {
        return { ok: false, message: "Kuruş kısmı en fazla iki hane olabilir." };
      }
    }
  }

  if (integerPart === "" && fractionPart === "") {
    return { ok: false, message: "Fiyat okunamadı." };
  }

  const minor =
    Number(integerPart || "0") * 100 + Number(fractionPart.padEnd(2, "0") || "0");

  if (!Number.isFinite(minor)) {
    return { ok: false, message: "Fiyat okunamadı." };
  }

  if (minor === 0) {
    return {
      ok: false,
      message:
        "Fiyat sıfır olamaz. Fiyat henüz belli değilse alanı BOŞ bırakın — " +
        'sitede "Fiyat için iletişime geçin" gösterilir.',
    };
  }

  if (minor > Number.MAX_SAFE_INTEGER) {
    return { ok: false, message: "Fiyat çok büyük." };
  }

  return { ok: true, minor };
}

/** Kuruşu forma geri yazmak için "1249,90" biçimine çevirir. */
export function formatMinorForInput(minor: number | null | undefined): string {
  if (typeof minor !== "number") return "";
  const lira = Math.trunc(minor / 100);
  const kurus = Math.abs(minor % 100);
  return `${lira},${String(kurus).padStart(2, "0")}`;
}
