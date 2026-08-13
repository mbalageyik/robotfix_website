import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { CheckCircleIcon } from "@/components/ui/icons";
import { ProductForm } from "@/components/admin/ProductForm";
import { ImageManager, type ManagedImage } from "@/components/admin/ImageManager";
import { ActionButton } from "@/components/admin/ActionButton";
import { DemoBadge, StatusBadge } from "@/components/admin/StatusBadge";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";
import { requireAdminPage } from "@/lib/auth/dal";
import {
  listAdminBrands,
  listAdminCategories,
  listAdminDeviceModels,
  listProductOptions,
} from "@/lib/admin/queries";
import { getAdminProduct } from "@/lib/admin/queries";
import { toProductFormValues } from "@/lib/admin/product-form-values";
import { duplicateProductAction, setProductStatusAction } from "@/lib/admin/product-actions";
import type { PublicationStatus } from "@/lib/data/types";

export const metadata: Metadata = {
  title: "Ürün düzenle",
  robots: ADMIN_ROBOTS,
};

export const dynamic = "force-dynamic";

/** Mevcut duruma göre teklif edilen geçişler. Bulunduğu durum tekrar sunulmaz. */
const STATUS_TRANSITIONS: Record<
  PublicationStatus,
  { status: PublicationStatus; label: string; confirm?: string }[]
> = {
  draft: [{ status: "active", label: "Yayımla" }],
  active: [
    { status: "passive", label: "Yayından kaldır" },
    { status: "draft", label: "Taslağa al" },
  ],
  passive: [
    { status: "active", label: "Yeniden yayımla" },
    { status: "draft", label: "Taslağa al" },
  ],
  archived: [{ status: "draft", label: "Arşivden çıkar (taslağa al)" }],
};

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kaydedildi?: string; kopyalandi?: string }>;
}) {
  const identity = await requireAdminPage();
  const { id } = await params;
  const { kaydedildi, kopyalandi } = await searchParams;

  const product = await getAdminProduct(id);

  /*
    Kayıt yoksa 404. RLS bir satırı gizlediğinde de buraya düşeriz ve bu
    DOĞRUDUR: "yetkin yok" ile "yok" arasındaki farkı göstermek, var olan
    kimliklerin sızmasına yol açardı.
  */
  if (!product.ok) notFound();

  const record = product.data;

  const [brands, categories, deviceModels, relatedCandidates] = await Promise.all([
    listAdminBrands(),
    listAdminCategories(),
    listAdminDeviceModels(),
    listProductOptions(record.id),
  ]);

  const values = toProductFormValues(record);
  const images: ManagedImage[] = (record.images ?? []).map((image) => ({
    id: image.id,
    storagePath: image.storage_path,
    altText: image.alt_text,
    isPrimary: image.is_primary,
    displayOrder: image.display_order,
  }));

  return (
    <AdminShell
      title={record.name}
      adminEmail={identity.email}
      description="Ürün bilgilerini düzenleyin, görsel yönetin ve yayın durumunu değiştirin."
      actions={
        <ButtonLink href="/admin/urunler" variant="secondary">
          Ürün listesi
        </ButtonLink>
      }
    >
      {(kaydedildi || kopyalandi) && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-success/35 bg-success/10 p-4 text-body text-success"
        >
          <CheckCircleIcon className="mt-0.5 size-5 shrink-0" />
          {kopyalandi
            ? "Ürün kopyalandı. Kopya TASLAK olarak oluşturuldu; ürün kodu ve görseller kopyalanmadı."
            : "Ürün oluşturuldu. Artık görsel ekleyebilirsiniz."}
        </div>
      )}

      {/* ---- Durum ve eylemler ----------------------------------------- */}
      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={record.status} />
            {record.is_demo && <DemoBadge />}
            <span className="text-caption text-text-muted">
              Slug: <code>{record.slug}</code>
            </span>
          </div>

          {record.is_demo && (
            <p className="text-caption text-text-muted">
              Bu bir ÖRNEK kayıttır (tasarım için tohumlanmıştır). Gerçek ürün bilgisi içermez ve
              yayına alınmamalıdır.
            </p>
          )}

          <div className="flex flex-wrap items-start gap-2">
            {STATUS_TRANSITIONS[record.status].map((transition) => (
              <ActionButton
                key={transition.status}
                action={setProductStatusAction}
                fields={{ id: record.id, status: transition.status }}
                label={transition.label}
                ariaLabel={`${record.name}: ${transition.label}`}
              />
            ))}

            {/*
              ARŞİVLEME kalıcı silmenin yerine geçer (bilgi dosyası §17).
              Geri alınabilir olduğu için onay adımı kısa tutulur ama yine de
              vardır: arşivlenen ürün siteden anında düşer.
            */}
            {record.status !== "archived" && (
              <ActionButton
                action={setProductStatusAction}
                fields={{ id: record.id, status: "archived" }}
                label="Arşivle"
                ariaLabel={`${record.name} ürününü arşivle`}
                confirm={{
                  question:
                    "Ürün arşivlenecek ve siteden kaldırılacak. Kayıt silinmez; istediğinizde arşivden çıkarabilirsiniz.",
                  confirmLabel: "Evet, arşivle",
                }}
              />
            )}

            <ActionButton
              action={duplicateProductAction}
              fields={{ id: record.id }}
              label="Kopyalayarak çoğalt"
              pendingLabel="Kopyalanıyor…"
              ariaLabel={`${record.name} ürününü kopyala`}
            />
          </div>
        </div>
      </Card>

      {/* ---- Görseller ------------------------------------------------- */}
      <section aria-labelledby="gorseller-baslik" className="flex flex-col gap-3">
        <h2 id="gorseller-baslik" className="text-h4">
          Görseller ({images.length})
        </h2>
        <ImageManager
          productId={record.id}
          images={images}
          supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL ?? null}
        />
      </section>

      {/* ---- Form ------------------------------------------------------ */}
      <section aria-labelledby="bilgiler-baslik" className="flex flex-col gap-3">
        <h2 id="bilgiler-baslik" className="text-h4">
          Ürün bilgileri
        </h2>
        <ProductForm
          values={values}
          options={{
            brands: brands.ok ? brands.data.map(({ id: value, name }) => ({ id: value, name })) : [],
            categories: categories.ok
              ? categories.data.map(({ id: value, name }) => ({ id: value, name }))
              : [],
            deviceModels: deviceModels.ok
              ? deviceModels.data.map(({ id: value, name, brandName }) => ({
                  id: value,
                  name,
                  brandName,
                }))
              : [],
            relatedCandidates: relatedCandidates.ok ? relatedCandidates.data : [],
          }}
        />
      </section>
    </AdminShell>
  );
}
