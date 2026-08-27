import type { Metadata } from "next";
import { Archivo, JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";

/*
  Tipografi — next/font ile SELF-HOST edilir (harici istek yok, gizlilik ve
  performans için).

  `weight` DİZİSİ VERİLMEZ VE BU BİLİNÇLİDİR. Üçü de Google Fonts'ta değişken
  (variable) fonttur; ama `weight: ["600", "700"]` gibi bir dizi verildiği anda
  next/font değişken dosyayı BIRAKIR ve her ağırlık için AYRI STATİK dosya
  indirir. Bu notun önceki hâli "tek dosyada tüm ağırlıklar" diyordu — üretim
  CSS'i ölçüldüğünde tersi çıktı: ayrık `font-weight: 400/500/600/700`
  blokları ve toplam 6 dosya / 144 KB. `weight` kaldırılınca aile başına tek
  değişken dosya iner ve tüm ağırlık aralığı onun içinden gelir.

  Ağırlık aralığı KISITLANMAZ: tasarım 400–700 arasını kullanıyor ve değişken
  font zaten sürekli bir eksen sunuyor.

  `latin-ext` alt kümesi Türkçe için ZORUNLUDUR: ğ Ğ ş Ş ı İ ç Ç ö Ö ü Ü
  karakterleri yalnız bu alt kümede bulunur.

  `display: "swap"` + next/font'un otomatik yedek font ölçü eşlemesi
  (adjustFontFallback, varsayılan açık) sayesinde font yüklenirken düzen
  kayması (CLS) oluşmaz.
*/

/** Başlık — neo-grotesk, teknik otorite (marka kitabı §4.1). Yalnız 600/700. */
const heading = Archivo({
  variable: "--font-heading",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

/** Gövde — açık apertür, Türkçe uzun kelimelerde okunur. */
const body = Manrope({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

/** Teknik veri — ürün/stok kodunda I·l·1 ve 0·O ayrımı okunabilirlik değil doğruluk meselesi. */
const technical = JetBrains_Mono({
  variable: "--font-technical",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  /*
    ÖN YÜKLEME KAPALI — tek font bu.

    Teknik font yalnız ürün/stok kodu gibi kısa, KÜÇÜK metinlerde kullanılır
    (`font-mono`: ürün kartı kodu, süreç adımı numarası, `<code>`). Hiçbir
    LCP adayı bu ailede değil. `preload: true` ile `<head>`e giren iki dosya
    (latin + latin-ext) ilk boyamayı bekleten yolda başlık ve gövde fontuyla
    bant genişliği için yarışıyordu.

    `false` fontu KALDIRMAZ: tarayıcı `font-mono` kullanan bir öğeye
    rastladığında indirir. `display: "swap"` sayesinde o ana kadar yedek
    monospace ile okunur kalır.
  */
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "Robot Fix",
    template: "%s — Robot Fix",
  },
  description:
    "Gaziantep merkezli robot süpürge teknik servisi, bakım, onarım ve yedek parça çözümleri.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${heading.variable} ${body.variable} ${technical.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
