import type { MetadataRoute } from "next";
import { listProductSitemapEntries } from "@/lib/data/sitemap";
import { siteUrl } from "@/lib/site-config";

/*
  sitemap.xml

  NE GİRER: yalnız GERÇEKTEN var olan, herkese açık ve kanonik sayfalar.

  1. Taslak/pasif ürün giremez — sorgu anon istemciyle çalışır ve RLS taslak
     satırı döndürmez (`lib/data/sitemap.ts`).
  2. Demo (`[ÖRNEK]`) satır giremez — bu, arayüzdeki `showDemoContent`
     bayrağından BAĞIMSIZ olarak sorguda ayrıca engellenir. Yerelde demo
     içerik aktifleştirilse bile sitemap temiz kalır.
  3. Filtreli katalog adresleri (`/urunler?marka=...`) giremez: bunlar kanonik
     değildir, hepsi `/urunler`e canonical verir. Sitemap'e konsalardı arama
     motoruna çelişkili sinyal gönderirdik.
  4. `/admin` ve `/veri-kontrol` giremez — `app/robots.ts` bunları zaten
     taramaya kapatır ve sayfaların kendi `noindex` meta'sı vardır.

  Marka, kategori ve hizmet DETAY sayfaları henüz YOK. Var olmayan URL'i
  sitemap'e yazmak (404 vaadi) SEO açısından zararlıdır; bu yüzden o sayfalar
  yazıldığında buraya eklenecektir.
*/

/** Sitemap saatlik tazelenir; her tarayıcı isteğinde veritabanına gitmez. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/urunler`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  const products = await listProductSitemapEntries();

  /*
    Sorgu patlarsa sitemap'i TÜMDEN düşürmeyiz: statik sayfalar yine
    yayımlanır. Hata sessizce yutulmaz, sunucu günlüğüne yazılır.
  */
  if (!products.ok) {
    if (products.error.kind !== "not_configured") {
      console.error(`[sitemap] ürünler okunamadı: ${products.error.message}`);
    }
    return staticEntries;
  }

  const productEntries: MetadataRoute.Sitemap = products.data.map((entry) => ({
    url: `${siteUrl}/urunler/${entry.slug}`,
    // `lastmod` UYDURULMAZ: `updated_at` yoksa alan hiç yazılmaz.
    ...(entry.updatedAt ? { lastModified: new Date(entry.updatedAt) } : {}),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...productEntries];
}
