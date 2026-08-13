import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { AvailabilityBadge } from "@/components/ui/AvailabilityBadge";
import { formatPriceOrNull, PRICE_ON_REQUEST_LABEL } from "@/components/ui/Price";
import {
  DemoBadge,
  PUBLICATION_STATUS_OPTIONS,
  StatusBadge,
} from "@/components/admin/StatusBadge";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";
import { requireAdminPage } from "@/lib/auth/dal";
import {
  ADMIN_PAGE_SIZE,
  listAdminBrands,
  listAdminCategories,
  listAdminProducts,
} from "@/lib/admin/queries";
import { publicationStatusSchema } from "@/lib/admin/schemas";

export const metadata: Metadata = {
  title: "Ürünler",
  robots: ADMIN_ROBOTS,
};

export const dynamic = "force-dynamic";

interface SearchParams {
  ara?: string;
  durum?: string;
  marka?: string;
  kategori?: string;
  sayfa?: string;
}

/** Filtreleri koruyarak sayfa bağlantısı üretir. */
function pageHref(params: SearchParams, page: number): string {
  const query = new URLSearchParams();
  if (params.ara) query.set("ara", params.ara);
  if (params.durum) query.set("durum", params.durum);
  if (params.marka) query.set("marka", params.marka);
  if (params.kategori) query.set("kategori", params.kategori);
  if (page > 1) query.set("sayfa", String(page));
  const qs = query.toString();
  return qs ? `/admin/urunler?${qs}` : "/admin/urunler";
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const identity = await requireAdminPage();
  const params = await searchParams;

  /*
    URL'den gelen her değer DOĞRULANIR. `durum` doğrudan sorguya verilseydi
    geçersiz bir enum değeri Postgres hatasına dönerdi; burada sessizce
    "filtre yok"a düşer.
  */
  const statusFilter = publicationStatusSchema.safeParse(params.durum);
  const page = Math.max(1, Number.parseInt(params.sayfa ?? "1", 10) || 1);

  const [products, brands, categories] = await Promise.all([
    listAdminProducts({
      search: params.ara,
      status: statusFilter.success ? statusFilter.data : undefined,
      brandId: params.marka || undefined,
      categoryId: params.kategori || undefined,
      page,
    }),
    listAdminBrands(),
    listAdminCategories(),
  ]);

  const brandOptions = brands.ok ? brands.data : [];
  const categoryOptions = categories.ok ? categories.data : [];

  const hasFilters = Boolean(params.ara || params.durum || params.marka || params.kategori);

  return (
    <AdminShell
      title="Ürünler"
      adminEmail={identity.email}
      description="Katalogdaki tüm ürünler — taslak, yayında, yayından kaldırılmış ve arşivlenmiş."
      actions={<ButtonLink href="/admin/urunler/yeni">Yeni ürün</ButtonLink>}
    >
      {/*
        FİLTRE FORMU: `method="get"`.

        Aramanın sonucu URL'de yaşar — yönetici bağlantıyı paylaşabilir, geri
        tuşu beklendiği gibi çalışır ve hiç istemci JS'i gerekmez. Arama bir
        YAZMA işlemi olmadığı için GET doğru fiildir.
      */}
      <Card>
        <form method="get" action="/admin/urunler" className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field id="ara" label="Ara" hint="Ürün adı veya ürün kodu (SKU)">
              {(props) => (
                <input {...props} type="search" name="ara" defaultValue={params.ara ?? ""} />
              )}
            </Field>

            <Field id="durum" label="Yayın durumu">
              {(props) => (
                <select {...props} name="durum" defaultValue={params.durum ?? ""}>
                  <option value="">Tümü</option>
                  {PUBLICATION_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field id="marka" label="Marka">
              {(props) => (
                <select {...props} name="marka" defaultValue={params.marka ?? ""}>
                  <option value="">Tümü</option>
                  {brandOptions.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field id="kategori" label="Kategori">
              {(props) => (
                <select {...props} name="kategori" defaultValue={params.kategori ?? ""}>
                  <option value="">Tümü</option>
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-button-edge bg-action px-4 py-2.5 text-body font-semibold text-action-fg hover:bg-action-hover"
            >
              Filtrele
            </button>
            {hasFilters && (
              <Link
                href="/admin/urunler"
                className="inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2.5 text-body font-semibold text-link underline underline-offset-4 hover:text-link-hover"
              >
                Filtreleri temizle
              </Link>
            )}
          </div>
        </form>
      </Card>

      {!products.ok ? (
        <ErrorState
          title="Ürünler yüklenemedi"
          description="Veritabanı sorgusu başarısız oldu. Yerel Supabase yığınının çalıştığından emin olun."
        />
      ) : products.data.items.length === 0 ? (
        <EmptyState
          title={hasFilters ? "Bu filtrelerle ürün bulunamadı" : "Henüz ürün yok"}
          description={
            hasFilters
              ? "Farklı bir arama veya filtre deneyin."
              : "İlk ürünü ekleyerek başlayın. Ürünler taslak olarak kaydedilebilir; yayına almadan önce bilgileri doğrulayın."
          }
          action={
            hasFilters ? (
              <ButtonLink href="/admin/urunler" variant="secondary">
                Filtreleri temizle
              </ButtonLink>
            ) : (
              <ButtonLink href="/admin/urunler/yeni">Yeni ürün</ButtonLink>
            )
          }
        />
      ) : (
        <>
          <p className="text-caption text-text-muted" role="status">
            {products.data.total} ürün bulundu. Sayfa {products.data.page} /{" "}
            {products.data.pageCount}.
          </p>

          {/*
            Tablo yerine kart listesi: ürün satırı çok sayıda farklı bilgi
            taşıyor (durum, stok, fiyat, görsel sayısı) ve dar ekranda tablo
            yatay kaydırmaya zorlar. Liste anlamsal olarak da doğru — sıralı
            olmayan bir kayıt kümesidir.
          */}
          <ul className="flex flex-col gap-3">
            {products.data.items.map((product) => {
              const price = formatPriceOrNull(
                product.priceMinor === null ? null : product.priceMinor / 100,
                product.currency,
              );

              return (
                <li key={product.id}>
                  <Card variant="interactive" padding="sm">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="text-body-lg font-semibold">
                            <Link
                              href={`/admin/urunler/${product.id}`}
                              className="rounded-sm hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2"
                            >
                              {product.name}
                            </Link>
                          </h2>
                          <p className="mt-1 text-caption text-text-muted">
                            <code>{product.slug}</code>
                            {product.sku && <> · SKU: {product.sku}</>}
                            {product.brand && <> · {product.brand.name}</>}
                            {product.category && <> · {product.category.name}</>}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {product.isDemo && <DemoBadge />}
                          <StatusBadge status={product.status} />
                          <AvailabilityBadge status={product.availability} />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-text-muted">
                        <span className={price ? "tabular-nums text-text" : "text-link"}>
                          {price ?? PRICE_ON_REQUEST_LABEL}
                        </span>
                        <span>
                          {product.imageCount} görsel
                          {product.imageCount === 0 && " — ana görsel yok"}
                        </span>
                        {product.isFeatured && <span>Öne çıkan</span>}
                        <span>Sıra: {product.displayOrder}</span>
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>

          {products.data.pageCount > 1 && (
            <nav aria-label="Sayfalama" className="flex flex-wrap items-center gap-2">
              {page > 1 && (
                <ButtonLink href={pageHref(params, page - 1)} variant="secondary" size="sm">
                  ← Önceki
                </ButtonLink>
              )}
              <span className="text-caption text-text-muted">
                {(page - 1) * ADMIN_PAGE_SIZE + 1}–
                {Math.min(page * ADMIN_PAGE_SIZE, products.data.total)} / {products.data.total}
              </span>
              {page < products.data.pageCount && (
                <ButtonLink href={pageHref(params, page + 1)} variant="secondary" size="sm">
                  Sonraki →
                </ButtonLink>
              )}
            </nav>
          )}
        </>
      )}
    </AdminShell>
  );
}
