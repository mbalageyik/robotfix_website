import type { Metadata } from "next";
import { Archivo, JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";

/*
  Tipografi — next/font ile SELF-HOST edilir (harici istek yok, gizlilik ve
  performans için). Her ikisi de değişken (variable) fonttur: tek dosyada tüm
  ağırlıklar, ayrı ayrı ağırlık indirmeye gerek yok.

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
  weight: ["600", "700"],
});

/** Gövde — açık apertür, Türkçe uzun kelimelerde okunur. */
const body = Manrope({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

/** Teknik veri — ürün/stok kodunda I·l·1 ve 0·O ayrımı okunabilirlik değil doğruluk meselesi. */
const technical = JetBrains_Mono({
  variable: "--font-technical",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  weight: ["400", "500"],
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
