import Link from "next/link";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/home/SectionHeading";
import { buildCatalogHref } from "@/lib/catalog/query-params";
import { BRANDS_DISCLAIMER } from "@/lib/home/content";
import type { DataResult } from "@/lib/data/result";
import type { BrandRow } from "@/lib/data/types";

/*
  Markalar (bilgi dosyası §13/5).

  LOGO KULLANILMAZ — bilinçli. §10: marka listesi "yetkili servis veya resmî
  marka ortaklığı anlamına gelmez" ve "logo kullanımları ... yetkili servisi
  olduğu izlenimi doğrulama olmadan oluşturulmamalıdır". Bir logo duvarı tam
  olarak o izlenimi kurar. Bu yüzden markalar METİN olarak listelenir; logo
  kullanımı ancak marka kullanım izinleri doğrulandığında gündeme gelir.
  (Şemadaki `brands.logo_path` alanı durur; burada okunmaz.)

  UYARI METNİ ZORUNLUDUR: marka adlarının göründüğü yerde §10 uyarısı da
  görünür. Metin `lib/home/content.ts` içindedir ve bu bölümden çıkarılamaz.

  Marka DETAY sayfası henüz yok; bağlantılar katalog filtresine gider.
*/

export function BrandsSection({ result }: { result: DataResult<BrandRow[]> }) {
  if (!result.ok || result.data.length === 0) return null;

  return (
    <Section id="markalar" labelledBy="markalar-baslik" surface="raised" width="wide">
      <SectionHeading
        id="markalar-baslik"
        overline="Markalar"
        title="Hizmet verilen ve parça sunulan markalar"
        description="Markaya tıklayarak katalogda o markaya ait ürünleri görebilirsiniz."
      />

      <ul className="mt-(--spacing-heading-gap) flex flex-wrap gap-3">
        {result.data.map((brand) => (
          <li key={brand.id}>
            <Link
              href={buildCatalogHref({ brandSlug: brand.slug })}
              /*
                Marka çipi bir KONTROLDÜR (buton ailesi), kart değil:
                `rounded-md` ve butonlarla aynı yükselti davranışı — duran
                hâlde e1, hover/odakta e2. Yer değiştirmez; buton gerekçesiyle
                aynı (bkz. `components/ui/Button.tsx`): çipler sarmalanan bir
                sıra içindedir, biri kalkarsa satır hizası gözle bozulur.
              */
              className="inline-flex min-h-11 items-center rounded-md border border-border-strong bg-surface px-4 py-2 text-body font-semibold text-text shadow-(--shadow-e1) transition-[color,border-color,box-shadow] duration-(--duration-fast) ease-(--ease-standard) hover:border-link hover:text-link hover:shadow-(--shadow-e2)"
            >
              {brand.name}
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-8 max-w-2xl text-caption text-text-muted">{BRANDS_DISCLAIMER}</p>
    </Section>
  );
}
