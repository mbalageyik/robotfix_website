import type { Metadata } from "next";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";
import { AvailabilityBadge } from "@/components/ui/AvailabilityBadge";
import { Card } from "@/components/ui/Card";
import { Container } from "@/components/layout/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Price } from "@/components/ui/Price";
import { Section } from "@/components/layout/Section";
import {
  getProductBySlug,
  getRelatedProducts,
  listFeaturedProducts,
  listProducts,
} from "@/lib/data/products";
import { listBrands, listCategories, listServices } from "@/lib/data/taxonomy";
import { listProductSitemapEntries } from "@/lib/data/sitemap";
import { getSiteConfig } from "@/lib/site-config";
import { isSupabaseConfigured, showDemoContent } from "@/lib/supabase/env";
import { getPublicClient } from "@/lib/supabase/public-client";
import { fail, ok, type DataResult } from "@/lib/data/result";
import type {
  BrandRow,
  CategoryRow,
  ProductDetail,
  ProductListItem,
  ServiceRow,
} from "@/lib/data/types";

/*
  VERİ KATMANI DOĞRULAMA SAYFASI.

  Amaç: Faz 2'de yazılan sorguların gerçek veriyle ne döndürdüğünü gözle
  görmek. Tasarım kaygısı yoktur; mevcut bileşenler kullanılır.

  Üretim navigasyonunda YOKTUR ve indekslenmez.

  Buradaki tüm ürünler tohum verisidir: `[ÖRNEK]` önekli, `is_demo = true`,
  `status = 'draft'` ve FİYATSIZ. Anonim istemci bunları normalde göremez —
  görünüyorlarsa NEXT_PUBLIC_SHOW_DEMO_PRODUCTS açık ve satırlar yayına
  alınmış demektir.
*/

/*
  Teşhis sayfası da panel gibi indekslenmez. Direktif elle YAZILMAZ,
  `ADMIN_ROBOTS`'tan gelir: iki ayrı yerde tutulsaydı biri güncellenip diğeri
  unutulabilirdi (burada `googleBot` alt-direktifi zaten eksikti).
*/
export const metadata: Metadata = {
  title: "Veri Kontrol",
  robots: ADMIN_ROBOTS,
};

// Veri her zaman taze okunsun; bu bir teşhis sayfasıdır.
export const dynamic = "force-dynamic";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border py-2 last:border-b-0">
      <span className="min-w-44 text-caption font-semibold text-text">{label}</span>
      <span className="text-caption text-text-muted">{value}</span>
    </div>
  );
}

/** Sonucu ya veriyle ya da HATAYLA gösterir — sessizce boş dizi göstermez. */
function ResultBlock<T>({
  title,
  result,
  render,
}: {
  title: string;
  result: DataResult<T>;
  render: (data: T) => React.ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <h3 className="text-h4">{title}</h3>
      {result.ok ? (
        render(result.data)
      ) : (
        <ErrorState
          title={`Sorgu başarısız — ${result.error.kind}`}
          description={result.error.message}
        />
      )}
    </Card>
  );
}

/*
  BİLEREK BOZUK SORGU — hata yolunun canlı kanıtı.

  Var olmayan bir sütun istenir; PostgREST 42703 döndürür. Amaç: `DataResult`
  sözleşmesinin hatayı YUTMADIĞINI ve `ErrorState`in göründüğünü her sayfa
  yüklemesinde ispatlamak. Bu blok yeşil görünürse hata yolu kırılmış demektir.

  Bu, teşhis sayfasına ait kalıcı bir öz-testtir; üretim yollarında kullanılmaz.
*/
async function probeErrorPath(): Promise<DataResult<never>> {
  if (!isSupabaseConfigured) {
    return fail("not_configured", "Supabase yapılandırılmamış.");
  }

  // Not: `select()` serbest metin aldığı için bu satır typecheck'ten GEÇER;
  // hata yalnız çalışma zamanında PostgREST tarafından üretilir (42703).
  const { error } = await getPublicClient().from("products").select("bu_sutun_yok").limit(1);

  if (error) return fail("query_failed", error.message, error.code);
  return ok(undefined as never);
}

/** Tek ürünün tüm alt verisini döker; iki farklı ürün profiliyle çağrılır. */
function ProductDetailBlock({
  title,
  result,
  related,
  relatedSource,
}: {
  title: string;
  result: DataResult<ProductDetail>;
  related: DataResult<ProductListItem[]> | null;
  relatedSource: string;
}) {
  return (
    <ResultBlock
      title={title}
      result={result}
      render={(product) => (
        <div className="flex flex-col gap-4">
          <div>
            <Row label="Ad" value={product.name} />
            <Row label="Slug" value={<code>{product.slug}</code>} />
            <Row label="Ürün kodu" value={<code>{product.sku ?? "—"}</code>} />
            <Row
              label="Fiyat"
              value={
                <Price
                  amount={product.priceMinor === null ? null : product.priceMinor / 100}
                  currency={product.currency}
                />
              }
            />
            <Row
              label="Bulunabilirlik"
              value={<AvailabilityBadge status={product.availability} />}
            />
            <Row
              label="Orijinal / uyumlu"
              value={
                product.isOriginal === null
                  ? "DOĞRULANMADI (null)"
                  : product.isOriginal
                    ? "orijinal"
                    : "uyumlu"
              }
            />
            <Row
              label="Teknik özellikler"
              value={
                product.specs.length === 0
                  ? "yok"
                  : product.specs.map((s) => `${s.label}: ${s.value}`).join(" · ")
              }
            />
          </div>

          <div>
            <h4 className="text-h4">Görseller ({product.images.length})</h4>
            {product.images.length === 0 ? (
              <p className="text-caption text-text-muted">
                görselsiz — kart ve detay bu durumu karşılamalı
              </p>
            ) : (
              <>
                <p className="text-caption text-text-muted">
                  Ana görsel:{" "}
                  <code>{product.primaryImage?.storagePath ?? "YOK — ilk görsele düşmeli"}</code>
                </p>
                <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5 text-caption text-text-muted">
                  {product.images.map((image) => (
                    <li key={image.id}>
                      <code>{image.storagePath}</code>
                      {image.isPrimary && " · ana görsel"}
                      <br />
                      <span>alt: {image.altText || "(boş — dekoratif)"}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>

          <div>
            <h4 className="text-h4">Uyumlu modeller ({product.compatibleModels.length})</h4>
            {product.compatibleModels.length === 0 ? (
              <p className="text-caption text-text-muted">yok</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1 text-caption text-text-muted">
                {product.compatibleModels.map((model) => (
                  <li key={model.id}>
                    {model.brandName} {model.name}
                    {model.verifiedNote === null && " — uyumluluk doğrulanmadı"}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h4 className="text-h4">Pazaryeri bağlantıları ({product.marketplaceLinks.length})</h4>
            {product.marketplaceLinks.length === 0 ? (
              <p className="text-caption text-text-muted">
                yok — bu pazaryerlerinin butonu hiç gösterilmez
              </p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1 text-caption text-text-muted">
                {product.marketplaceLinks.map((link) => (
                  <li key={link.id}>
                    {link.customLabel ?? link.marketplace} ·{" "}
                    {link.linkTarget === "store" ? "mağazaya gider" : "ürüne gider"} ·{" "}
                    <code>{link.url}</code>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h4 className="text-h4">İlgili ürünler ({relatedSource})</h4>
            {related === null ? (
              <p className="text-caption text-text-muted">sorgulanmadı</p>
            ) : related.ok ? (
              related.data.length === 0 ? (
                <p className="text-caption text-text-muted">yok</p>
              ) : (
                <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5 text-caption text-text-muted">
                  {related.data.map((item) => (
                    <li key={item.id}>{item.name}</li>
                  ))}
                </ol>
              )
            ) : (
              <ErrorState
                title={`İlgili ürün sorgusu başarısız — ${related.error.kind}`}
                description={related.error.message}
              />
            )}
          </div>
        </div>
      )}
    />
  );
}

/*
  ANA SAYFA SIZINTI KONTROLÜ (Faz 5) — yardımcılar.

  "Sızıntı" burada iki şeyden biridir:
    1. Tohum verisinin `[ÖRNEK]` işareti — ada bakılarak yakalanır,
    2. `is_demo` bayrağı — satırın kendi alanı.

  İkisi ayrı ayrı kontrol edilir: ada bakmak, bayrağı yanlış girilmiş bir
  satırı da yakalar; bayrağa bakmak, adı temizlenmiş ama hâlâ demo olan
  satırı yakalar. Tek ölçüt yeterli olmazdı.
*/
interface LeakRow {
  id: string;
  name: string;
  slug: string;
  isDemo: boolean;
}

/** Tohum verisinin bıraktığı işaretler. Üretimde hiçbiri görünmemelidir. */
function hasDemoMarker(row: LeakRow): boolean {
  return row.name.includes("[ÖRNEK]") || row.slug.startsWith("ornek-") || row.isDemo;
}

function LeakList({ title, result }: { title: string; result: DataResult<LeakRow[]> }) {
  if (!result.ok) {
    return (
      <ErrorState
        title={`${title} — sorgu başarısız (${result.error.kind})`}
        description={result.error.message}
      />
    );
  }

  const leaked = result.data.filter(hasDemoMarker);

  return (
    <div className="border-b border-border py-3 last:border-b-0">
      <p className="text-caption font-semibold text-text">
        {title} — {result.data.length} satır ana sayfaya düşüyor
      </p>
      {result.data.length === 0 ? (
        <p className="text-caption text-text-muted">
          boş — bölüm ana sayfada gizlenir veya boş durum metni gösterir
        </p>
      ) : (
        <p className="text-caption text-text-muted">
          {result.data.map((row) => row.name).join(", ")}
        </p>
      )}
      <p
        className={
          leaked.length === 0
            ? "text-caption font-semibold text-success"
            : "text-caption font-semibold text-danger"
        }
      >
        {leaked.length === 0
          ? "Demo/örnek işaretli satır YOK"
          : `SIZINTI: ${leaked.length} demo satır ana sayfada görünür — ${leaked
              .map((row) => row.slug)
              .join(", ")}`}
      </p>
    </div>
  );
}

function HomepageLeakBlock({
  featured,
  categories,
  brands,
  services,
}: {
  featured: DataResult<ProductListItem[]>;
  categories: DataResult<CategoryRow[]>;
  brands: DataResult<BrandRow[]>;
  services: DataResult<ServiceRow[]>;
}) {
  const toRows = <T extends { id: string; name: string; slug: string; is_demo: boolean }>(
    result: DataResult<T[]>,
  ): DataResult<LeakRow[]> =>
    result.ok
      ? ok(
          result.data.map((row) => ({
            id: row.id,
            name: row.name,
            slug: row.slug,
            isDemo: row.is_demo,
          })),
        )
      : result;

  return (
    <Card>
      <h2 className="text-h3">Ana sayfa sızıntı kontrolü</h2>
      <p className="mt-2 text-caption text-text-muted">
        Ana sayfanın dört sorgusu (<code>listFeaturedProducts</code>, <code>listCategories</code>,{" "}
        <code>listBrands</code>, <code>listServices</code>) anon istemciyle çalışır ve{" "}
        <code>status</code> filtresi yazmaz — görünürlüğü RLS belirler. Aşağıdaki her satır ana
        sayfada gerçekten görünür; <code>[ÖRNEK]</code> veya <code>ornek-</code> işaretli hiçbir
        kayıt burada bulunmamalıdır.
      </p>
      <div className="mt-3">
        <LeakList
          title="Öne çıkan ürünler (Robot Fix Seçkisi)"
          result={
            featured.ok
              ? ok(
                  featured.data.map((item) => ({
                    id: item.id,
                    name: item.name,
                    slug: item.slug,
                    isDemo: item.isDemo,
                  })),
                )
              : featured
          }
        />
        <LeakList title="Kategoriler" result={toRows(categories)} />
        <LeakList title="Markalar" result={toRows(brands)} />
        <LeakList title="Hizmetler" result={toRows(services)} />
      </div>
    </Card>
  );
}

export default async function DataCheckPage() {
  const [
    productsResult,
    featuredResult,
    brandsResult,
    categoriesResult,
    servicesResult,
    outOfStockResult,
    nameSortResult,
    priceSortResult,
    noMatchResult,
    errorProbeResult,
    sitemapResult,
    siteConfig,
  ] = await Promise.all([
    listProducts({}, "manual", { perPage: 8 }),
    listFeaturedProducts(4),
    listBrands(),
    listCategories(),
    listServices(),
    listProducts({ availability: ["out_of_stock"] }),
    listProducts({}, "name_asc", { perPage: 5 }),
    listProducts({}, "price_asc", { perPage: 5 }),
    // Hiçbir şeyle eşleşmeyecek arama → EmptyState yolu.
    listProducts({ search: "zzzz-eslesmeyen-arama-zzzz" }),
    probeErrorPath(),
    // Faz 4: sitemap'in gördüğü ürünler. Buradaki sayı ile "Ürün listesi"
    // bloğundaki sayı AYNI korumaya tabidir; ikisi de RLS'ten geçer.
    listProductSitemapEntries(),
    getSiteConfig(),
  ]);

  /*
    İKİ ürün detayı bilerek çekilir:
      - `ornek-ana-firca-modulu`: çok görselli, uyumluluğu dolu, pazaryeri
        bağlantısı VAR, elle seçilmiş ilgili ürünleri var.
      - `ornek-hepa-filtre`: görselsiz, pazaryeri bağlantısı YOK, ilgili
        ürünleri kategoriden TÜRETİLİR.
    Tek ürünle bu karşıtlıkların hiçbiri görünmezdi.
  */
  const [richDetail, sparseDetail] = await Promise.all([
    getProductBySlug("ornek-ana-firca-modulu"),
    getProductBySlug("ornek-hepa-filtre"),
  ]);

  const [richRelated, sparseRelated] = await Promise.all([
    richDetail.ok
      ? getRelatedProducts(richDetail.data.id, richDetail.data.category?.slug ?? null)
      : Promise.resolve(null),
    sparseDetail.ok
      ? getRelatedProducts(sparseDetail.data.id, sparseDetail.data.category?.slug ?? null)
      : Promise.resolve(null),
  ]);

  return (
    <>
      <Section surface="dark" spacing="tight" labelledBy="dk-title">
        <p className="text-overline text-accent-tech uppercase">Faz 2 · Doğrulama</p>
        <h1 id="dk-title" className="mt-2 text-h1">
          Veri Katmanı Kontrolü
        </h1>
        <p className="mt-4 max-w-prose text-body-lg text-text-muted">
          Üretim navigasyonunda yer almaz, indekslenmez. Gösterilen ürünler{" "}
          <strong>örnek veridir</strong>; fiyatları yoktur ve gerçek katalog yönetim panelinden
          girilecektir.
        </p>
      </Section>

      <Container width="wide" className="flex flex-col gap-5 py-10">
        <Card>
          <h2 className="text-h3">Yapılandırma</h2>
          <div className="mt-3">
            <Row
              label="Supabase"
              value={isSupabaseConfigured ? "yapılandırıldı" : "YAPILANDIRILMADI (.env.local boş)"}
            />
            <Row
              label="Demo içerik görünürlüğü"
              value={showDemoContent ? "açık (yalnız geliştirme)" : "kapalı"}
            />
            <Row label="Site ayarı kaynağı" value={siteConfig.source} />
            <Row
              label="WhatsApp numarası"
              value={siteConfig.whatsappPhone ?? "yok — CTA'lar gizlenir"}
            />
            <Row label="Adres" value={siteConfig.addressLine ?? "girilmedi (TODO business)"} />
            <Row
              label="Çalışma saatleri"
              value={siteConfig.workingHours ?? "girilmedi (TODO business)"}
            />
            <Row
              label="Mağaza bağlantıları"
              value={
                siteConfig.storeLinks.length === 0
                  ? "hiçbiri girilmedi — buton gösterilmez"
                  : siteConfig.storeLinks.map((link) => link.label).join(", ")
              }
            />
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <ResultBlock
            title="Ürün listesi (ilk 8)"
            result={productsResult}
            render={(page) =>
              page.items.length === 0 ? (
                <EmptyState
                  title="Anonim istemciye görünen ürün yok"
                  description="Beklenen davranış: tohum verisinin tamamı draft, RLS bunları döndürmez."
                />
              ) : (
                <>
                  <p className="text-caption text-text-muted">
                    toplam {page.total} · sayfa {page.page}/{page.pageCount}
                  </p>
                  <ul className="flex flex-col gap-3">
                    {page.items.map((item) => (
                      <li key={item.id} className="flex flex-col gap-1 border-t border-border pt-3">
                        <span className="font-semibold text-text">{item.name}</span>
                        <span className="text-caption text-text-muted">
                          {item.brand?.name ?? "markasız"} · {item.category?.name ?? "kategorisiz"}{" "}
                          · <code>{item.sku ?? "kodsuz"}</code>
                        </span>
                        <div className="flex flex-wrap items-center gap-3">
                          <AvailabilityBadge status={item.availability} />
                          <Price
                            amount={item.priceMinor === null ? null : item.priceMinor / 100}
                            compareAtAmount={
                              item.compareAtPriceMinor === null
                                ? null
                                : item.compareAtPriceMinor / 100
                            }
                            currency={item.currency}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )
            }
          />

          <ResultBlock
            title="Öne çıkan ürünler"
            result={featuredResult}
            render={(items) =>
              items.length === 0 ? (
                <EmptyState title="Öne çıkan ürün yok" />
              ) : (
                <ul className="flex flex-col gap-1 text-caption text-text-muted">
                  {items.map((item) => (
                    <li key={item.id}>{item.name}</li>
                  ))}
                </ul>
              )
            }
          />

          <ResultBlock
            title="Markalar"
            result={brandsResult}
            render={(brands) =>
              brands.length === 0 ? (
                <EmptyState title="Görünen marka yok" />
              ) : (
                <p className="text-caption text-text-muted">
                  {brands.length} kayıt: {brands.map((b) => b.name).join(", ")}
                </p>
              )
            }
          />

          <ResultBlock
            title="Kategoriler"
            result={categoriesResult}
            render={(categories) =>
              categories.length === 0 ? (
                <EmptyState title="Görünen kategori yok" />
              ) : (
                <p className="text-caption text-text-muted">
                  {categories.length} kayıt: {categories.map((c) => c.name).join(", ")}
                </p>
              )
            }
          />

          <ResultBlock
            title="Hizmetler"
            result={servicesResult}
            render={(services) =>
              services.length === 0 ? (
                <EmptyState
                  title="Görünen hizmet yok"
                  description="Beklenen: hizmetler draft — kapsamları doğrulanana kadar yayımlanmaz."
                />
              ) : (
                <p className="text-caption text-text-muted">
                  {services.map((s) => s.name).join(", ")}
                </p>
              )
            }
          />

          <ResultBlock
            title="Filtre: yalnız 'Tükendi'"
            result={outOfStockResult}
            render={(page) => (
              <p className="text-caption text-text-muted">
                {page.total} sonuç
                {page.items.length > 0 && ` — ${page.items.map((i) => i.name).join(", ")}`}
              </p>
            )}
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <ResultBlock
            title="Sıralama: ada göre (A→Z)"
            result={nameSortResult}
            render={(page) => (
              <ol className="flex list-decimal flex-col gap-1 pl-5 text-caption text-text-muted">
                {page.items.map((item) => (
                  <li key={item.id}>{item.name}</li>
                ))}
              </ol>
            )}
          />

          <ResultBlock
            title="Sıralama: fiyata göre (artan)"
            result={priceSortResult}
            render={(page) => (
              <>
                <p className="text-caption text-text-muted">
                  Fiyatsız ürünler SONA gitmeli — &ldquo;en ucuz&rdquo; gibi görünmemeli.
                </p>
                <ol className="flex list-decimal flex-col gap-1 pl-5 text-caption text-text-muted">
                  {page.items.map((item) => (
                    <li key={item.id}>
                      {item.name} —{" "}
                      {item.priceMinor === null ? "fiyat yok" : `${item.priceMinor / 100}`}
                    </li>
                  ))}
                </ol>
              </>
            )}
          />

          <ResultBlock
            title="Sonuç dönmeyen filtre"
            result={noMatchResult}
            render={(page) =>
              page.items.length === 0 ? (
                <EmptyState
                  title="Aramanıza uygun ürün bulunamadı"
                  description="Beklenen davranış: boş sonuç bir HATA değildir; ok:true + boş dizi döner."
                />
              ) : (
                <p className="text-caption text-text-muted">
                  BEKLENMEDİK: {page.total} sonuç döndü.
                </p>
              )
            }
          />

          <ResultBlock
            title="Hata yolu kanıtı (bilerek bozuk sorgu)"
            result={errorProbeResult}
            render={() => (
              <p className="text-caption text-text-muted">
                BEKLENMEDİK: bozuk sorgu başarılı döndü — hata yolu kırılmış olabilir.
              </p>
            )}
          />

          {/*
            SITEMAP SIZINTI KONTROLÜ (Faz 4).

            Sitemap'e giren her slug herkese açık bir vaattir. Burada listelenen
            slug'ların hiçbiri `[ÖRNEK]`/demo olmamalı ve hepsinin gerçek bir
            `/urunler/<slug>` sayfası bulunmalıdır. `is_demo` filtresi sitemap
            sorgusunda AYRICA uygulanır — arayüzdeki demo bayrağı açıkken bile.
          */}
          <ResultBlock
            title="Sitemap'e giren ürünler"
            result={sitemapResult}
            render={(entries) =>
              entries.length === 0 ? (
                <EmptyState
                  title="Sitemap'te ürün yok"
                  description="Beklenen davranış: tohum verisinin tamamı draft + demo; sitemap boş kalır."
                />
              ) : (
                <>
                  <p className="text-caption text-text-muted">
                    {entries.length} slug. Aşağıda &ldquo;ornek-&rdquo; ile başlayan veya{" "}
                    <code>[ÖRNEK]</code> içeren bir slug GÖRÜNMEMELİDİR.
                  </p>
                  <ul className="mt-2 flex flex-col gap-1 text-caption text-text-muted">
                    {entries.map((entry) => (
                      <li key={entry.slug}>
                        <code>/urunler/{entry.slug}</code>
                        {entry.updatedAt ? ` · ${entry.updatedAt}` : " · lastmod yok"}
                      </li>
                    ))}
                  </ul>
                </>
              )
            }
          />
        </div>

        {/*
          ANA SAYFA SIZINTI KONTROLÜ (Faz 5).

          Ana sayfa dört sorgu kullanır: öne çıkan ürünler, kategoriler,
          markalar, hizmetler. Dördü de anon istemciyle çalışır ve `status`
          filtresi YAZMAZ — görünürlüğü RLS belirler. Bu blok, o dört
          kaynaktan ana sayfaya düşen HER SATIRI adıyla listeler ve demo
          sızıntısını ayrıca işaretler.

          Yeşil ölçüt: `[ÖRNEK]` içeren veya `ornek-` ile başlayan hiçbir ad
          burada GÖRÜNMEMELİDİR (demo görünürlüğü kapalıyken).
        */}
        <HomepageLeakBlock
          featured={featuredResult}
          categories={categoriesResult}
          brands={brandsResult}
          services={servicesResult}
        />

        <ProductDetailBlock
          title="Ürün detayı — zengin (görselli, bağlantılı, elle ilgili ürünler)"
          result={richDetail}
          related={richRelated}
          relatedSource="elle seçilmiş olmalı"
        />

        <ProductDetailBlock
          title="Ürün detayı — seyrek (görselsiz, pazaryeri bağlantısı yok)"
          result={sparseDetail}
          related={sparseRelated}
          relatedSource="kategoriden türetilmiş olmalı"
        />

        <Card>
          <h2 className="text-h3">Fiyat davranışı</h2>
          <p className="mt-2 text-caption text-text-muted">
            Fiyatı olmayan üründe hiçbir yerde 0 TL, boş değer veya &ldquo;undefined&rdquo;
            görünmemelidir.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-caption text-text-muted">price_minor = null</p>
              <Price amount={null} />
            </div>
            <div>
              <p className="text-caption text-text-muted">price_minor = 124900 [ÖRNEK]</p>
              <Price amount={124900 / 100} />
            </div>
            <div>
              <p className="text-caption text-text-muted">indirimli [ÖRNEK]</p>
              <Price amount={124900 / 100} compareAtAmount={149900 / 100} />
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-h3">₺ glif kontrolü</h2>
          <p className="mt-2 text-caption text-text-muted">
            Üç font ailesinde de Türk lirası sembolü (U+20BA) render edilmeli; yedek fonta düşerse
            harflerden görünür biçimde ayrışır.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <p className="font-display text-h3" data-testid="lira-display">
              ₺ 1.249,00 — Archivo
            </p>
            <p className="font-sans text-h3" data-testid="lira-body">
              ₺ 1.249,00 — Manrope
            </p>
            <p className="font-mono text-h3" data-testid="lira-mono">
              ₺ 1.249,00 — JetBrains Mono
            </p>
          </div>
        </Card>
      </Container>
    </>
  );
}
