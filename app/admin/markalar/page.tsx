import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { ErrorState } from "@/components/ui/ErrorState";
import { BrandForm } from "@/components/admin/TaxonomyForms";
import { NewRecordDisclosure, TaxonomyList } from "@/components/admin/TaxonomyList";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";
import { requireAdminPage } from "@/lib/auth/dal";
import { getDependencyCounts, listAdminBrands } from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Markalar",
  robots: ADMIN_ROBOTS,
};

export const dynamic = "force-dynamic";

const EMPTY_BRAND = {
  id: null,
  name: "",
  slug: "",
  description: "",
  displayOrder: 0,
  status: "draft" as const,
};

export default async function AdminBrandsPage() {
  const identity = await requireAdminPage();
  const [brands, dependencies] = await Promise.all([listAdminBrands(), getDependencyCounts()]);

  return (
    <AdminShell
      title="Markalar"
      adminEmail={identity.email}
      description="Ürün markaları. Cihaz modelleri de bir markaya bağlanır."
    >
      <NewRecordDisclosure label="+ Yeni marka ekle">
        <BrandForm values={EMPTY_BRAND} />
      </NewRecordDisclosure>

      {!brands.ok ? (
        <ErrorState
          title="Markalar yüklenemedi"
          description="Veritabanı sorgusu başarısız oldu."
        />
      ) : (
        <TaxonomyList
          table="brands"
          itemNoun="marka"
          emptyTitle="Henüz marka yok"
          emptyDescription="İlk markayı ekleyerek başlayın; ürünler ve cihaz modelleri markalara bağlanır."
          records={brands.data.map((brand) => {
            const productCount = dependencies.ok
              ? (dependencies.data.productsByBrand[brand.id] ?? 0)
              : 0;
            const modelCount = dependencies.ok
              ? (dependencies.data.modelsByBrand[brand.id] ?? 0)
              : 0;
            const total = productCount + modelCount;

            return {
              id: brand.id,
              name: brand.name,
              slug: brand.slug,
              status: brand.status,
              isDemo: brand.is_demo,
              meta: `${productCount} ürün · ${modelCount} cihaz modeli`,
              dependencyNote:
                total > 0
                  ? `Bu markaya bağlı ${total} kayıt var (${productCount} ürün, ${modelCount} cihaz modeli).`
                  : undefined,
              editForm: (
                <BrandForm
                  values={{
                    id: brand.id,
                    name: brand.name,
                    slug: brand.slug,
                    description: brand.description ?? "",
                    displayOrder: brand.display_order,
                    status: brand.status,
                  }}
                />
              ),
            };
          })}
        />
      )}
    </AdminShell>
  );
}
