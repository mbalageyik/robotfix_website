import type { Metadata } from "next";
import "./globals.css";

/*
  Kök layout — Faz 0 iskeleti.
  Faz 1'de: next/font ile tipografi, tasarım tokenları, header/footer bileşenleri eklenecek.
  TODO(business): metadataBase için gerçek alan adı (NEXT_PUBLIC_SITE_URL) doğrulanacak.
*/
export const metadata: Metadata = {
  title: "Robot Fix",
  description:
    "Gaziantep merkezli robot süpürge teknik servisi, bakım, onarım ve yedek parça çözümleri.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
