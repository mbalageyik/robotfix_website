/*
  WCAG 2.2 kontrast hesabı — yalnız testlerde kullanılır, uygulamaya paket edilmez.
  Kaynak: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
*/

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** `#RGB` veya `#RRGGBB` biçimini 0-255 bileşenlerine ayırır. */
export function parseHex(hex: string): Rgb {
  const value = hex.trim().replace(/^#/, "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;

  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Geçersiz hex rengi: ${hex}`);
  }

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** sRGB bileşenini doğrusallaştırır (WCAG relative luminance adımı). */
function linearize(channel8bit: number): number {
  const c = channel8bit / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG bağıl parlaklık (0 = siyah, 1 = beyaz). */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** İki renk arasındaki kontrast oranı (1 – 21 arası). */
export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const [lighter, darker] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

/** İki ondalıkla yuvarlanmış oran — hata mesajlarını okunur kılar. */
export function ratio(foreground: string, background: string): number {
  return Math.round(contrastRatio(foreground, background) * 100) / 100;
}

/** WCAG AA eşikleri. */
export const AA = {
  /** Normal metin. */
  text: 4.5,
  /** Büyük metin (≥24px veya ≥18.66px bold). */
  largeText: 3,
  /** Buton, form sınırı, odak göstergesi gibi arayüz öğeleri. */
  nonText: 3,
} as const;
