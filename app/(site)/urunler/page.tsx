import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { ProductsLayoutToggle } from "@/components/catalog/ProductsLayoutToggle";
import { Container } from "@/components/layout/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Section } from "@/components/layout/Section";
import {
  buildCatalogHref,
  formatDeviceModelRef,
  hasActiveFilters,
  parseCatalogQuery,
  parseDeviceModelRef,
  type RawSearchParams,
} from "@/lib/catalog/query-params";
import { listProducts } from "@/lib/data/products";
import { listBrands, listCategories, listDeviceModels } from "@/lib/data/taxonomy";
import { unwrapOr } from "@/lib/data/result";
import { siteUrl } from "@/lib/site-config";

/*
  ÜRÜN LİSTESİ.

  GÖRÜNÜRLÜK: bu sayfa `status` filtresi YAZMAZ. `lib/data/products.ts`
  başındaki gerekçe burada da geçerlidir — taslak/pasif satırları RLS eler
  (`supabase/migrations/...rls.sql`). Sayfaya bir "önizleme" veya "taslakları
  da göster" kaçamağı EKLENMEZ; panelin taslak görme yolu ayrıdır ve
  yöneticinin kendi oturumundan geçer (`lib/admin/queries.ts`).

  Sonuç: katalog henüz yayına alınmamışken bu sayfa BOŞ görünür. Bu bir hata
  değildir ve öyle sunulmaz — boş durum metni bunu açıkça söyler.
*/

const PER_PAGE = 24;

export const metadata: Metadata = {
  title: "Ürünler",
  description:
    "Robot süpürge yedek parça ve aksesuar kataloğu: fırça, filtre, batarya ve daha fazlası. Markaya, kategoriye ve uyumlu modele göre filtreleyin.",
  alternates: { canonical: `${siteUrl}/urunler` },
};

/**
 * Katalog düzenli değişir; her istekte veritabanına gitmek yerine ISR ile
 * dakikalık tazelik yeterlidir. Panelden yapılan değişiklik en geç bu süre
 * içinde yayına yansır.
 */
export const revalidate = 300;

export default async function ProductsPage({ searchParams }: PageProps<"/urunler">) {
  const rawParams = (await searchParams) as RawSearchParams;
  const query = parseCatalogQuery(rawParams);

  const [brandsResult, categoriesResult, modelsResult] = await Promise.all([
    listBrands(),
    listCategories(),
    listDeviceModels(),
  ]);

  /*
    Taksonomi listeleri filtre kutularını doldurur. Biri patlarsa sayfanın
    tamamını düşürmek yerine o kutu boş kalır — hata sunucu günlüğüne yazılır
    (`unwrapOr` hatayı yutmaz, kaydeder).
  */
  const brands = unwrapOr(brandsResult, [], "listBrands");
  const categories = unwrapOr(categoriesResult, [], "listCategories");
  const deviceModels = unwrapOr(modelsResult, [], "listDeviceModels");

  /*
    Model seçenekleri.

    Model slug'ı yalnız MARKA İÇİNDE benzersizdir (şema kısıtı
    `UNIQUE (brand_id, slug)`), bu yüzden hem URL değeri hem de görünen etiket
    markayla birlikte kurulur. Markası çözülemeyen model listeye ALINMAZ:
    referansı benzersiz olmadığı için filtresi de güvenilir olmazdı.
  */
  const brandsById = new Map(brands.map((brand) => [brand.id, brand]));
  const deviceModelOptions = deviceModels.flatMap((model) => {
    const brand = brandsById.get(model.brand_id);
    if (!brand) return [];

    return [
      {
        id: model.id,
        slug: formatDeviceModelRef(brand.slug, model.slug),
        label: `${brand.name} — ${model.name}`,
      },
    ];
  });

  /*
    URL'deki `marka:model` referansını sorgunun istediği id'ye çeviririz.
    Referans çözülemezse filtre UYGULANMAZ — uydurma bir id ile boş sonuç
    göstermek yerine geçersiz parametreyi yok sayarız.
  */
  const modelRef = parseDeviceModelRef(query.deviceModelRef);
  const deviceModelId = modelRef
    ? deviceModels.find(
        (model) =>
          model.slug === modelRef.modelSlug &&
          brandsById.get(model.brand_id)?.slug === modelRef.brandSlug,
      )?.id
    : undefined;

  const productsResult = await listProducts(
    {
      brandSlug: query.brandSlug,
      categorySlug: query.categorySlug,
      deviceModelId,
      search: query.search,
    },
    query.sort,
    { page: query.page, perPage: PER_PAGE },
  );

  const filtersApplied = hasActiveFilters(query);

  /*
    "Son sayfanın ötesi" ile "hiç ürün yok" AYRI durumlardır.

    Katalogda ürün varken boş bir sayfaya düşmek arıza değildir — yer imi,
    arama motoru veya sayfa açıkken katalogdan ürün çıkarılması bunu üretir.
    Bu durumda "katalog yayında değil" demek YANLIŞ bilgi olurdu; kullanıcıya
    gerçekte kaç sayfa olduğunu söyleyip geri dönüş yolu veririz.
  */
  const pageBeyondEnd =
    productsResult.ok &&
    productsResult.data.total > 0 &&
    query.page > productsResult.data.pageCount;

  return (
    <main id="icerik" tabIndex={-1} className="flex-1">
      <Section surface="raised" spacing="tight" labelledBy="urunler-basligi">
        <Breadcrumbs items={[{ label: "Ana sayfa", href: "/" }, { label: "Ürünler" }]} />
        <h1 id="urunler-basligi" className="mt-3 text-h1">
          Ürünler
        </h1>
        <p className="mt-3 max-w-prose text-body-lg text-text-muted">
          Robot süpürge yedek parça ve aksesuarları. Cihazınıza uygun parçayı bulmak için markaya,
          kategoriye veya uyumlu modele göre daraltabilirsiniz.
        </p>
      </Section>

      <Container width="wide" className="flex flex-col gap-6 py-10">
        <CatalogFilters
          query={query}
          brands={brands}
          categories={categories}
          deviceModels={deviceModelOptions}
          showReset={filtersApplied}
        />

        {!productsResult.ok ? (
          <ErrorState
            title="Ürünler şu anda listelenemiyor"
            description="Katalog verisine ulaşılamadı. Lütfen sayfayı yenileyin; sorun sürerse bize WhatsApp'tan yazabilirsiniz."
          />
        ) : pageBeyondEnd ? (
          <EmptyState
            title="Bu sayfada ürün yok"
            description={`Bu listede ${productsResult.data.total} ürün var ve ${productsResult.data.pageCount} sayfaya sığıyor. İstediğiniz ${query.page}. sayfa bu nedenle boş.`}
            action={
              <Link
                href={buildCatalogHref({ ...query, page: 1 })}
                className="text-body font-semibold text-link underline underline-offset-4 hover:text-link-hover"
              >
                İlk sayfaya dön
              </Link>
            }
          />
        ) : productsResult.data.items.length === 0 ? (
          filtersApplied ? (
            <EmptyState
              title="Seçtiğiniz filtrelere uyan ürün bulunamadı"
              description="Filtreleri gevşetmeyi veya farklı bir arama terimi denemeyi önerebiliriz."
              action={
                <Link
                  href="/urunler"
                  className="text-body font-semibold text-link underline underline-offset-4 hover:text-link-hover"
                >
                  Tüm ürünleri göster
                </Link>
              }
            />
          ) : (
            /*
              Katalog henüz yayında değil. Bu metin bir VAAT İÇERMEZ ("yakında
              500 ürün" gibi) — yalnız mevcut durumu bildirir (§20).
            */
            <EmptyState
              title="Ürün kataloğu henüz yayında değil"
              description="Ürünler yönetim panelinden eklendikçe bu sayfada listelenecek. İhtiyacınız olan parçayı şimdiden WhatsApp üzerinden sorabilirsiniz."
            />
          )
        ) : (
          <>
            <p className="text-caption text-text-muted" aria-live="polite">
              {productsResult.data.total} ürün
              {productsResult.data.pageCount > 1 &&
                ` · sayfa ${productsResult.data.page}/${productsResult.data.pageCount}`}
            </p>

            {/*
              Görünüm değiştirici İLERİCİ BİR GELİŞTİRMEDİR: liste sunucuda
              render edilir, JS yüklenmese bile ürünler HTML'de tam olarak
              bulunur. Veri akışı değişmedi — yukarıdaki `listProducts()`
              sonucu doğrudan aşağı iniyor, yeni bir sorgu yok.
              İlk satır LCP adayıdır; yalnız o kartlar öncelikli yüklenir.
            */}
            <ProductsLayoutToggle products={productsResult.data.items} priorityCount={4} />

            {productsResult.data.pageCount > 1 && (
              <nav
                aria-label="Sayfalar arasında gezinme"
                className="flex items-center justify-between gap-4 border-t border-border pt-5"
              >
                {query.page > 1 ? (
                  <Link
                    href={buildCatalogHref({ ...query, page: query.page - 1 })}
                    className="text-body font-semibold text-link underline underline-offset-4 hover:text-link-hover"
                    rel="prev"
                  >
                    ← Önceki sayfa
                  </Link>
                ) : (
                  <span />
                )}

                {query.page < productsResult.data.pageCount ? (
                  <Link
                    href={buildCatalogHref({ ...query, page: query.page + 1 })}
                    className="text-body font-semibold text-link underline underline-offset-4 hover:text-link-hover"
                    rel="next"
                  >
                    Sonraki sayfa →
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            )}
          </>
        )}
      </Container>
    </main>
  );
}
