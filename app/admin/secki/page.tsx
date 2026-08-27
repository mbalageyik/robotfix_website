import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Field } from "@/components/ui/Field";
import { ActionButton, DisabledActionButton } from "@/components/admin/ActionButton";
import { FeaturedProductsManager } from "@/components/admin/FeaturedProductsManager";
import { DemoBadge, PUBLICATION_STATUS_OPTIONS, StatusBadge } from "@/components/admin/StatusBadge";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";
import { requireAdminPage } from "@/lib/auth/dal";
import { setProductFeaturedAction } from "@/lib/admin/featured-actions";
import {
  ADMIN_PAGE_SIZE,
  listAdminFeaturedProducts,
  listAdminProducts,
} from "@/lib/admin/queries";
import { publicationStatusSchema } from "@/lib/admin/schemas";
import { showDemoContent } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Robot Fix Seçkisi",
  robots: ADMIN_ROBOTS,
};

export const dynamic = "force-dynamic";

/*
  Robot Fix Seçkisi ekranı.

  NEDEN AYRI BİR SAYFA: seçki üyeliği (`products.is_featured`) ürün formunda da
  düzenlenebilir ve orada KALIR — ama form sekiz bölümlük, altı ekran boyunda
  bir belgedir ve kutucuk en alttaki "Yayın ve SEO" bölümündedir. "Ana sayfada
  hangi ürünler görünüyor?" sorusunun cevabı, ürünleri tek tek açmayı gerektiren
  bir yerde duramaz.

  İKİ YÜZEY, TEK KAYNAK: burası da form da `products.is_featured` /
  `products.display_order` sütunlarını okur ve yazar. Ayrı bir "seçki" tablosu
  YOKTUR; olsaydı iki kaynağın birbirinden ayrı düşmesi an meselesiydi.

  ROTA ADI `secki`: ana sayfadaki bölümün çapası da `#secki`, başlığı da
  "Robot Fix Seçkisi". Panelde başka bir ad kullanmak, bu görevin çözdüğü
  karışıklığı yeniden üretirdi.
*/

interface SearchParams {
  ara?: string;
  durum?: string;
  sayfa?: string;
}

/** Arama filtrelerini koruyarak sayfa bağlantısı üretir. */
function pageHref(params: SearchParams, page: number): string {
  const query = new URLSearchParams();
  if (params.ara) query.set("ara", params.ara);
  if (params.durum) query.set("durum", params.durum);
  if (page > 1) query.set("sayfa", String(page));
  const qs = query.toString();
  return qs ? `/admin/secki?${qs}` : "/admin/secki";
}

export default async function AdminFeaturedPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const identity = await requireAdminPage();
  const params = await searchParams;

  // URL'den gelen enum DOĞRULANIR; geçersiz değer sessizce "filtre yok"a düşer.
  const statusFilter = publicationStatusSchema.safeParse(params.durum);
  const page = Math.max(1, Number.parseInt(params.sayfa ?? "1", 10) || 1);

  const [featured, candidates] = await Promise.all([
    listAdminFeaturedProducts(),
    listAdminProducts({
      search: params.ara,
      status: statusFilter.success ? statusFilter.data : undefined,
      page,
    }),
  ]);

  const hasFilters = Boolean(params.ara || params.durum);

  return (
    <AdminShell
      title="Robot Fix Seçkisi"
      adminEmail={identity.email}
      description="Ana sayfadaki “Robot Fix Seçkisi” bölümünde hangi ürünlerin, hangi sırayla görüneceğini buradan yönetirsiniz. Aynı ayar her ürünün kendi düzenleme formunda da bulunur."
      actions={
        <ButtonLink href="/#secki" variant="secondary" external>
          Ana sayfadaki bölümü gör
        </ButtonLink>
      }
    >
      {!featured.ok ? (
        <ErrorState
          title="Seçki yüklenemedi"
          description="Veritabanı sorgusu başarısız oldu. Yerel Supabase yığınının çalıştığından emin olun."
        />
      ) : (
        <FeaturedProductsManager
          rows={featured.data}
          supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL ?? null}
          showDemoContent={showDemoContent}
        />
      )}

      {/* ---- Seçkiye ürün ekle ---------------------------------------- */}
      <section aria-labelledby="secki-ekle-baslik" className="flex flex-col gap-3">
        <h2 id="secki-ekle-baslik" className="text-h4">
          Seçkiye ürün ekle
        </h2>

        {/*
          FİLTRE FORMU `method="get"` — arama bir YAZMA işlemi değildir ve
          sonucu URL'de yaşamalıdır (`/admin/urunler` ile aynı desen).
        */}
        <Card>
          <form method="get" action="/admin/secki" className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="ara" label="Ara" hint="Ürün adı veya ürün kodu (SKU)">
                {(props) => (
                  <input {...props} type="search" name="ara" defaultValue={params.ara ?? ""} />
                )}
              </Field>

              <Field
                id="durum"
                label="Yayın durumu"
                hint="Yalnız “Yayında” olan ürünler ana sayfada görünür."
              >
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
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-button-edge bg-action px-4 py-2.5 text-body font-semibold text-action-fg hover:bg-action-hover"
              >
                Ara
              </button>
              {hasFilters && (
                <Link
                  href="/admin/secki"
                  className="inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2.5 text-body font-semibold text-link underline underline-offset-4 hover:text-link-hover"
                >
                  Aramayı temizle
                </Link>
              )}
            </div>
          </form>
        </Card>

        {!candidates.ok ? (
          <ErrorState
            title="Ürünler yüklenemedi"
            description="Veritabanı sorgusu başarısız oldu."
          />
        ) : candidates.data.items.length === 0 ? (
          <EmptyState
            title={hasFilters ? "Bu aramayla ürün bulunamadı" : "Henüz ürün yok"}
            description={
              hasFilters
                ? "Farklı bir arama veya filtre deneyin."
                : "Önce kataloğa ürün ekleyin; seçki mevcut ürünler arasından seçilir."
            }
            action={
              hasFilters ? (
                <ButtonLink href="/admin/secki" variant="secondary">
                  Aramayı temizle
                </ButtonLink>
              ) : (
                <ButtonLink href="/admin/urunler/yeni">Yeni ürün</ButtonLink>
              )
            }
          />
        ) : (
          <>
            <p className="text-caption text-text-muted" role="status">
              {candidates.data.total} ürün bulundu. Sayfa {candidates.data.page} /{" "}
              {candidates.data.pageCount}.
            </p>

            <ul className="flex flex-col gap-2">
              {candidates.data.items.map((product) => (
                <li key={product.id}>
                  <Card padding="sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-body font-semibold">
                          <Link
                            href={`/admin/urunler/${product.id}`}
                            className="rounded-sm hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2"
                          >
                            {product.name}
                          </Link>
                        </p>
                        <p className="mt-1 text-caption text-text-muted">
                          <code>{product.slug}</code>
                          {product.sku && <> · SKU: {product.sku}</>}
                          {" · Sıra: "}
                          {product.displayOrder}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {product.isDemo && <DemoBadge />}
                        <StatusBadge status={product.status} />

                        {product.isFeatured ? (
                          <DisabledActionButton
                            label="Seçkide"
                            ariaLabel={`${product.name} zaten Robot Fix Seçkisi'nde`}
                          />
                        ) : (
                          <ActionButton
                            action={setProductFeaturedAction}
                            fields={{ productId: product.id, featured: "true" }}
                            label="Seçkiye ekle"
                            ariaLabel={`${product.name} ürününü Robot Fix Seçkisi'ne ekle`}
                          />
                        )}
                      </div>
                    </div>

                    {/*
                      Taslak/pasif/arşiv ürün SEÇKİYE EKLENEBİLİR — engellemek
                      yanlış olurdu: yönetici bir ürünü önce hazırlayıp sonra
                      yayımlayabilir. Ama sonucun ne olacağı ÖNCEDEN söylenir.
                    */}
                    {product.status !== "active" && (
                      <p className="mt-2 text-caption text-warning">
                        Yayında değil — seçkiye eklense bile ürün yayımlanana kadar ana sayfada
                        görünmez.
                      </p>
                    )}
                  </Card>
                </li>
              ))}
            </ul>

            {candidates.data.pageCount > 1 && (
              <nav aria-label="Ürün seçimi sayfalama" className="flex flex-wrap items-center gap-2">
                {page > 1 && (
                  <ButtonLink href={pageHref(params, page - 1)} variant="secondary" size="sm">
                    ← Önceki
                  </ButtonLink>
                )}
                <span className="text-caption text-text-muted">
                  {(page - 1) * ADMIN_PAGE_SIZE + 1}–
                  {Math.min(page * ADMIN_PAGE_SIZE, candidates.data.total)} /{" "}
                  {candidates.data.total}
                </span>
                {page < candidates.data.pageCount && (
                  <ButtonLink href={pageHref(params, page + 1)} variant="secondary" size="sm">
                    Sonraki →
                  </ButtonLink>
                )}
              </nav>
            )}
          </>
        )}
      </section>
    </AdminShell>
  );
}
