import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { DeviceModelForm } from "@/components/admin/TaxonomyForms";
import { NewRecordDisclosure, TaxonomyList } from "@/components/admin/TaxonomyList";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";
import { requireAdminPage } from "@/lib/auth/dal";
import { getDependencyCounts, listAdminBrands, listAdminDeviceModels } from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Cihaz modelleri",
  robots: ADMIN_ROBOTS,
};

export const dynamic = "force-dynamic";

const EMPTY_MODEL = {
  id: null,
  name: "",
  slug: "",
  brandId: "",
  notes: "",
  status: "draft" as const,
};

export default async function AdminDeviceModelsPage() {
  const identity = await requireAdminPage();
  const [models, brands, dependencies] = await Promise.all([
    listAdminDeviceModels(),
    listAdminBrands(),
    getDependencyCounts(),
  ]);

  const brandOptions = brands.ok ? brands.data.map(({ id, name }) => ({ id, name })) : [];

  return (
    <AdminShell
      title="Cihaz modelleri"
      adminEmail={identity.email}
      description="Ürünlerin uyumlu olduğu robot süpürge modelleri. Her model bir markaya bağlıdır."
    >
      {/*
        MARKA ÖNKOŞULU: model markasız oluşturulamaz (slug marka içinde
        benzersiz). Marka yoksa boş bir form göstermek kullanıcıyı çıkmaza
        sokardı; onun yerine ne yapması gerektiği söylenir.
      */}
      {brandOptions.length === 0 ? (
        <EmptyState
          title="Önce marka eklemelisiniz"
          description="Cihaz modeli bir markaya bağlanır. Model eklemeden önce en az bir marka oluşturun."
          action={<ButtonLink href="/admin/markalar">Markalara git</ButtonLink>}
        />
      ) : (
        <NewRecordDisclosure label="+ Yeni cihaz modeli ekle">
          <DeviceModelForm values={EMPTY_MODEL} brands={brandOptions} />
        </NewRecordDisclosure>
      )}

      {!models.ok ? (
        <ErrorState
          title="Cihaz modelleri yüklenemedi"
          description="Veritabanı sorgusu başarısız oldu."
        />
      ) : (
        <TaxonomyList
          table="device_models"
          itemNoun="cihaz modeli"
          emptyTitle="Henüz cihaz modeli yok"
          emptyDescription="Modeller, ürün formundaki 'uyumlu cihaz modelleri' seçiminde kullanılır."
          records={models.data.map((model) => {
            const productCount = dependencies.ok
              ? (dependencies.data.productsByDeviceModel[model.id] ?? 0)
              : 0;

            return {
              id: model.id,
              name: model.name,
              slug: model.slug,
              status: model.status,
              isDemo: model.is_demo,
              meta: (
                <>
                  {model.brandName} · {productCount} uyumlu ürün
                </>
              ),
              dependencyNote:
                productCount > 0
                  ? `Bu model ${productCount} ürünle uyumlu olarak işaretlenmiş.`
                  : undefined,
              editForm: (
                <DeviceModelForm
                  values={{
                    id: model.id,
                    name: model.name,
                    slug: model.slug,
                    brandId: model.brand_id,
                    notes: model.notes ?? "",
                    status: model.status,
                  }}
                  brands={brandOptions}
                />
              ),
            };
          })}
        />
      )}

      <p className="text-caption text-text-muted">
        Uyumluluk doğrulanmış bir iddiadır (bilgi dosyası §20). Ürün formundaki uyumlu model
        seçimi için{" "}
        <Link href="/admin/urunler" className="text-link underline">
          ürünler
        </Link>{" "}
        ekranına gidin.
      </p>
    </AdminShell>
  );
}
