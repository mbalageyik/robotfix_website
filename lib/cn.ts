/**
 * Koşullu sınıf birleştirici.
 *
 * Bilinçli olarak `tailwind-merge` KULLANMIYORUZ (sıfır ek bağımlılık). Bunun
 * sözleşmesi: bileşenlere geçilen `className` yalnız **yerleşim** içindir
 * (margin, genişlik, grid alanı, sıra). Renk, dolgu ve yarıçap bileşenin
 * varyant API'siyle değiştirilir — sınıf çakışması bu sayede oluşmaz.
 */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
