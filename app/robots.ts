import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-config";

/*
  robots.txt — yönetim paneli taramaya kapalıdır (bilgi dosyası §17).

  `/veri-kontrol` de kapatılır: teşhis sayfasıdır, üretim navigasyonunda yoktur
  ve indekslenmemelidir (sayfanın kendi meta'sı da `noindex` taşır).

  Bu, sayfa başına konan `noindex` meta'sının YERİNE GEÇMEZ; ikisi birlikte
  çalışır (gerekçe: lib/admin/robots.ts).
*/
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/veri-kontrol"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
