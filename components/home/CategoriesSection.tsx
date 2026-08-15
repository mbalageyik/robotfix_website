import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/layout/Section";
import { SectionHeading } from "@/components/home/SectionHeading";
import { ArrowRightIcon } from "@/components/ui/icons";
import { buildCatalogHref } from "@/lib/catalog/query-params";
import type { DataResult } from "@/lib/data/result";
import type { CategoryRow } from "@/lib/data/types";

/*
  Ürün kategorileri (bilgi dosyası §13/4).

  Kategori DETAY sayfası henüz yoktur; bağlantılar katalogdaki filtreye gider
  (`/urunler?kategori=...`). Adres `buildCatalogHref` ile kurulur — sorgu
  parametresi adı ("kategori") tek yerde tanımlıdır, burada tekrar yazılmaz.

  VERİ YOKSA BÖLÜM HİÇ RENDER EDİLMEZ: uydurma kategori kartı üretmeyiz ve
  boş bir ızgara göstermeyiz. Sorgu hatası da aynı şekilde sessizce gizlenir —
  ana sayfanın omurgası (hizmet, iletişim, WhatsApp) buna bağlı değildir.
*/

export function CategoriesSection({ result }: { result: DataResult<CategoryRow[]> }) {
  if (!result.ok || result.data.length === 0) return null;

  return (
    <Section id="kategoriler" labelledBy="kategoriler-baslik" width="wide">
      <SectionHeading
        id="kategoriler-baslik"
        overline="Kategoriler"
        title="Parça türüne göre inceleyin"
        description="Aradığınız parçanın türünü seçin, katalog o kategoriye daraltılsın."
      />

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {result.data.map((category) => (
          <li key={category.id} className="flex">
            <Card variant="interactive" className="relative flex w-full flex-col gap-2">
              <h3 className="text-h4">
                <Link
                  href={buildCatalogHref({ categorySlug: category.slug })}
                  className="after:absolute after:inset-0 after:content-[''] hover:text-link focus-visible:text-link"
                >
                  {category.name}
                </Link>
              </h3>
              {category.description && (
                <p className="text-caption text-text-muted">{category.description}</p>
              )}
              <span className="mt-auto flex items-center gap-1.5 pt-2 text-caption font-semibold text-link">
                Ürünleri gör
                <ArrowRightIcon className="size-4" />
              </span>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}
