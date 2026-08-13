import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { ErrorState } from "@/components/ui/ErrorState";
import { CategoryForm } from "@/components/admin/TaxonomyForms";
import { NewRecordDisclosure, TaxonomyList } from "@/components/admin/TaxonomyList";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";
import { requireAdminPage } from "@/lib/auth/dal";
import { getDependencyCounts, listAdminCategories } from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Kategoriler",
  robots: ADMIN_ROBOTS,
};

export const dynamic = "force-dynamic";

const EMPTY_CATEGORY = {
  id: null,
  name: "",
  slug: "",
  description: "",
  parentId: "",
  displayOrder: 0,
  status: "draft" as const,
};

export default async function AdminCategoriesPage() {
  const identity = await requireAdminPage();
  const [categories, dependencies] = await Promise.all([
    listAdminCategories(),
    getDependencyCounts(),
  ]);

  const all = categories.ok ? categories.data : [];
  const nameById = new Map(all.map((category) => [category.id, category.name]));

  return (
    <AdminShell
      title="Kategoriler"
      adminEmail={identity.email}
      description="Ürün kategorileri. Kategoriler iç içe olabilir; döngüsel zincirler sunucuda engellenir."
    >
      <NewRecordDisclosure label="+ Yeni kategori ekle">
        <CategoryForm
          values={EMPTY_CATEGORY}
          parentOptions={all.map(({ id, name }) => ({ id, name }))}
        />
      </NewRecordDisclosure>

      {!categories.ok ? (
        <ErrorState
          title="Kategoriler yüklenemedi"
          description="Veritabanı sorgusu başarısız oldu."
        />
      ) : (
        <TaxonomyList
          table="categories"
          itemNoun="kategori"
          emptyTitle="Henüz kategori yok"
          emptyDescription="İlk kategoriyi ekleyerek başlayın; ürünler kategorilere bağlanır."
          records={all.map((category) => {
            const productCount = dependencies.ok
              ? (dependencies.data.productsByCategory[category.id] ?? 0)
              : 0;
            const childCount = dependencies.ok
              ? (dependencies.data.childrenByCategory[category.id] ?? 0)
              : 0;
            const total = productCount + childCount;
            const parentName = category.parent_id ? nameById.get(category.parent_id) : null;

            return {
              id: category.id,
              name: category.name,
              slug: category.slug,
              status: category.status,
              isDemo: category.is_demo,
              meta: `${parentName ? `Üst: ${parentName} · ` : "Üst düzey · "}${productCount} ürün · ${childCount} alt kategori`,
              dependencyNote:
                total > 0
                  ? `Bu kategoriye bağlı ${total} kayıt var (${productCount} ürün, ${childCount} alt kategori).`
                  : undefined,
              editForm: (
                <CategoryForm
                  values={{
                    id: category.id,
                    name: category.name,
                    slug: category.slug,
                    description: category.description ?? "",
                    parentId: category.parent_id ?? "",
                    displayOrder: category.display_order,
                    status: category.status,
                  }}
                  /*
                    Kaydın KENDİSİ üst kategori adayı olamaz. Daha derin
                    döngüler (A→B→A) sunucuda `wouldCreateCycle` ile yakalanır;
                    burada hesaplanmaz çünkü istemci doğrulaması bir güvenlik
                    sınırı değildir.
                  */
                  parentOptions={all
                    .filter((candidate) => candidate.id !== category.id)
                    .map(({ id, name }) => ({ id, name }))}
                />
              ),
            };
          })}
        />
      )}
    </AdminShell>
  );
}
