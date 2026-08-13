import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { ButtonLink } from "@/components/ui/Button";
import { ProductForm } from "@/components/admin/ProductForm";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";
import { requireAdminPage } from "@/lib/auth/dal";
import {
  listAdminBrands,
  listAdminCategories,
  listAdminDeviceModels,
  listProductOptions,
} from "@/lib/admin/queries";
import { EMPTY_PRODUCT_FORM } from "@/lib/admin/product-form-values";

export const metadata: Metadata = {
  title: "Yeni ürün",
  robots: ADMIN_ROBOTS,
};

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const identity = await requireAdminPage();

  const [brands, categories, deviceModels, relatedCandidates] = await Promise.all([
    listAdminBrands(),
    listAdminCategories(),
    listAdminDeviceModels(),
    listProductOptions(),
  ]);

  return (
    <AdminShell
      title="Yeni ürün"
      adminEmail={identity.email}
      description="Ürün taslak olarak oluşturulur. Görsel eklemek için önce kaydedin — görseller ürün kimliğine bağlanır."
      actions={
        <ButtonLink href="/admin/urunler" variant="secondary">
          Ürün listesi
        </ButtonLink>
      }
    >
      <ProductForm
        values={EMPTY_PRODUCT_FORM}
        options={{
          brands: brands.ok ? brands.data.map(({ id, name }) => ({ id, name })) : [],
          categories: categories.ok ? categories.data.map(({ id, name }) => ({ id, name })) : [],
          deviceModels: deviceModels.ok
            ? deviceModels.data.map(({ id, name, brandName }) => ({ id, name, brandName }))
            : [],
          relatedCandidates: relatedCandidates.ok ? relatedCandidates.data : [],
        }}
      />
    </AdminShell>
  );
}
