import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { ErrorState } from "@/components/ui/ErrorState";
import { ServiceForm } from "@/components/admin/TaxonomyForms";
import { NewRecordDisclosure, TaxonomyList } from "@/components/admin/TaxonomyList";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";
import { requireAdminPage } from "@/lib/auth/dal";
import { listAdminServices } from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Hizmetler",
  robots: ADMIN_ROBOTS,
};

export const dynamic = "force-dynamic";

const EMPTY_SERVICE = {
  id: null,
  name: "",
  slug: "",
  shortDescription: "",
  longDescription: "",
  iconKey: "",
  displayOrder: 0,
  status: "draft" as const,
  seoTitle: "",
  seoDescription: "",
};

export default async function AdminServicesPage() {
  const identity = await requireAdminPage();
  const services = await listAdminServices();

  return (
    <AdminShell
      title="Hizmetler"
      adminEmail={identity.email}
      description="Teknik servis hizmetleri. Servis ücreti alanı bilinçli olarak yoktur — ücret doğrulanmadan yayımlanmaz."
    >
      <NewRecordDisclosure label="+ Yeni hizmet ekle">
        <ServiceForm values={EMPTY_SERVICE} />
      </NewRecordDisclosure>

      {!services.ok ? (
        <ErrorState
          title="Hizmetler yüklenemedi"
          description="Veritabanı sorgusu başarısız oldu."
        />
      ) : (
        <TaxonomyList
          table="services"
          itemNoun="hizmet"
          emptyTitle="Henüz hizmet yok"
          emptyDescription="Hizmetler site üzerinde WhatsApp üzerinden randevu/teklif akışına bağlanır."
          records={services.data.map((service) => ({
            id: service.id,
            name: service.name,
            slug: service.slug,
            status: service.status,
            isDemo: service.is_demo,
            meta: service.short_description ?? "Kısa açıklama girilmemiş",
            editForm: (
              <ServiceForm
                values={{
                  id: service.id,
                  name: service.name,
                  slug: service.slug,
                  shortDescription: service.short_description ?? "",
                  longDescription: service.long_description ?? "",
                  iconKey: service.icon_key ?? "",
                  displayOrder: service.display_order,
                  status: service.status,
                  seoTitle: service.seo_title ?? "",
                  seoDescription: service.seo_description ?? "",
                }}
              />
            ),
          }))}
        />
      )}
    </AdminShell>
  );
}
