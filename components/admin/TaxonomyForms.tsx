"use client";

import { useActionState, useId, type ReactNode } from "react";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { FormFeedback } from "@/components/admin/FormFeedback";
import { PUBLICATION_STATUS_OPTIONS } from "@/components/admin/StatusBadge";
import {
  saveBrandAction,
  saveCategoryAction,
  saveDeviceModelAction,
  saveServiceAction,
} from "@/lib/admin/taxonomy-actions";
import { IDLE_ACTION_STATE, type ActionState } from "@/lib/admin/action-result";
import type { PublicationStatus } from "@/lib/data/types";

/*
  Marka / Kategori / Cihaz modeli / Hizmet formları.

  Dördü de aynı iskeleti paylaşır (`TaxonomyFormShell`) ama AYRI bileşenlerdir:
  alan kümeleri gerçekten farklı ve tek bir "her şeyi yapan" forma sıkıştırmak
  her alanı koşullu hâle getirip okunmaz kılardı.

  Hepsi aynı sözleşmeyi izler:
  - `values` yoksa form "yeni kayıt" modundadır.
  - Slug boş bırakılabilir; sunucu veritabanının `slugify()` fonksiyonuyla üretir.
  - Kaydetme, doğrulama ve yetki kontrolü tamamen sunucudadır.
*/

type TaxonomyAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

function TaxonomyFormShell({
  action,
  id,
  submitLabel,
  children,
}: {
  action: TaxonomyAction;
  id: string | null;
  submitLabel: string;
  children: (context: { formId: string; errors: Record<string, string> }) => ReactNode;
}) {
  const [state, formAction] = useActionState(action, IDLE_ACTION_STATE);
  const formId = useId();

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {id && <input type="hidden" name="id" value={id} />}
      <FormFeedback state={state} />
      {children({ formId, errors: state.fieldErrors })}
      <div>
        <SubmitButton pendingLabel="Kaydediliyor…">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}

/** Dört formda da aynı olan slug alanı. */
function SlugField({
  formId,
  error,
  defaultValue,
}: {
  formId: string;
  error?: string;
  defaultValue: string;
}) {
  return (
    <Field
      id={`${formId}-slug`}
      label="Slug (adres)"
      hint="Boş bırakılırsa addan otomatik üretilir. Yayındaki bir kaydın slug'ını değiştirmek eski bağlantıları kırar."
      error={error}
    >
      {(props) => (
        <input
          {...props}
          name="slug"
          defaultValue={defaultValue}
          maxLength={200}
          autoCapitalize="none"
          spellCheck={false}
          placeholder="otomatik"
        />
      )}
    </Field>
  );
}

/** Dört formda da aynı olan yayın durumu alanı. */
function StatusField({
  formId,
  error,
  defaultValue,
}: {
  formId: string;
  error?: string;
  defaultValue: PublicationStatus;
}) {
  return (
    <Field id={`${formId}-status`} label="Yayın durumu" required error={error}>
      {(props) => (
        <select {...props} name="status" defaultValue={defaultValue}>
          {PUBLICATION_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

function OrderField({
  formId,
  error,
  defaultValue,
}: {
  formId: string;
  error?: string;
  defaultValue: number;
}) {
  return (
    <Field
      id={`${formId}-order`}
      label="Sıra"
      hint="Küçük sayı önce gösterilir."
      error={error}
    >
      {(props) => (
        <input
          {...props}
          name="displayOrder"
          type="number"
          min={0}
          step={1}
          defaultValue={defaultValue}
        />
      )}
    </Field>
  );
}

// --- Marka ----------------------------------------------------------------

export interface BrandFormValues {
  id: string | null;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  status: PublicationStatus;
}

export function BrandForm({ values }: { values: BrandFormValues }) {
  return (
    <TaxonomyFormShell
      action={saveBrandAction}
      id={values.id}
      submitLabel={values.id ? "Markayı kaydet" : "Marka oluştur"}
    >
      {({ formId, errors }) => (
        <>
          <Field id={`${formId}-name`} label="Marka adı" required error={errors.name}>
            {(props) => (
              <input {...props} name="name" defaultValue={values.name} maxLength={120} required />
            )}
          </Field>

          <SlugField formId={formId} error={errors.slug} defaultValue={values.slug} />

          <Field id={`${formId}-description`} label="Açıklama" error={errors.description}>
            {(props) => (
              <textarea
                {...props}
                name="description"
                defaultValue={values.description}
                rows={3}
                maxLength={2000}
              />
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <OrderField
              formId={formId}
              error={errors.displayOrder}
              defaultValue={values.displayOrder}
            />
            <StatusField formId={formId} error={errors.status} defaultValue={values.status} />
          </div>
        </>
      )}
    </TaxonomyFormShell>
  );
}

// --- Kategori -------------------------------------------------------------

export interface CategoryFormValues extends BrandFormValues {
  parentId: string;
}

export function CategoryForm({
  values,
  parentOptions,
}: {
  values: CategoryFormValues;
  /** Üst kategori adayları. Kaydın KENDİSİ bu listede olmamalıdır. */
  parentOptions: { id: string; name: string }[];
}) {
  return (
    <TaxonomyFormShell
      action={saveCategoryAction}
      id={values.id}
      submitLabel={values.id ? "Kategoriyi kaydet" : "Kategori oluştur"}
    >
      {({ formId, errors }) => (
        <>
          <Field id={`${formId}-name`} label="Kategori adı" required error={errors.name}>
            {(props) => (
              <input {...props} name="name" defaultValue={values.name} maxLength={120} required />
            )}
          </Field>

          <SlugField formId={formId} error={errors.slug} defaultValue={values.slug} />

          {/*
            ÜST KATEGORİ: döngüsel referans sunucuda engellenir
            (`wouldCreateCycle`). Buradaki listeden yalnız kaydın KENDİSİ
            çıkarılır; daha derin döngüler istemcide hesaplanmaz çünkü istemci
            doğrulaması güvenlik sınırı değildir ve zincir sunucuda zaten
            yürünür.
          */}
          <Field
            id={`${formId}-parent`}
            label="Üst kategori"
            hint="Boş bırakılırsa üst düzey kategori olur."
            error={errors.parentId}
          >
            {(props) => (
              <select {...props} name="parentId" defaultValue={values.parentId}>
                <option value="">Üst düzey (üst kategori yok)</option>
                {parentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field id={`${formId}-description`} label="Açıklama" error={errors.description}>
            {(props) => (
              <textarea
                {...props}
                name="description"
                defaultValue={values.description}
                rows={3}
                maxLength={2000}
              />
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <OrderField
              formId={formId}
              error={errors.displayOrder}
              defaultValue={values.displayOrder}
            />
            <StatusField formId={formId} error={errors.status} defaultValue={values.status} />
          </div>
        </>
      )}
    </TaxonomyFormShell>
  );
}

// --- Cihaz modeli ---------------------------------------------------------

export interface DeviceModelFormValues {
  id: string | null;
  name: string;
  slug: string;
  brandId: string;
  notes: string;
  status: PublicationStatus;
}

export function DeviceModelForm({
  values,
  brands,
}: {
  values: DeviceModelFormValues;
  brands: { id: string; name: string }[];
}) {
  return (
    <TaxonomyFormShell
      action={saveDeviceModelAction}
      id={values.id}
      submitLabel={values.id ? "Modeli kaydet" : "Model oluştur"}
    >
      {({ formId, errors }) => (
        <>
          <Field id={`${formId}-name`} label="Model adı" required error={errors.name}>
            {(props) => (
              <input {...props} name="name" defaultValue={values.name} maxLength={120} required />
            )}
          </Field>

          {/*
            MARKA ZORUNLUDUR: slug marka İÇİNDE benzersizdir, yani markasız bir
            model şemada anlamsızdır. Boş seçenek bilinçli olarak sunulmaz.
          */}
          <Field
            id={`${formId}-brand`}
            label="Marka"
            required
            hint="Model slug'ı marka içinde benzersizdir; marka zorunludur."
            error={errors.brandId}
          >
            {(props) => (
              <select {...props} name="brandId" defaultValue={values.brandId} required>
                <option value="">Seçin…</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <SlugField formId={formId} error={errors.slug} defaultValue={values.slug} />

          <Field
            id={`${formId}-notes`}
            label="Notlar"
            hint="Yalnız doğrulanmış bilgi girin (ör. üretim yılı aralığı)."
            error={errors.notes}
          >
            {(props) => (
              <textarea
                {...props}
                name="notes"
                defaultValue={values.notes}
                rows={3}
                maxLength={1000}
              />
            )}
          </Field>

          <StatusField formId={formId} error={errors.status} defaultValue={values.status} />
        </>
      )}
    </TaxonomyFormShell>
  );
}

// --- Hizmet ---------------------------------------------------------------

export interface ServiceFormValues {
  id: string | null;
  name: string;
  slug: string;
  shortDescription: string;
  longDescription: string;
  iconKey: string;
  displayOrder: number;
  status: PublicationStatus;
  seoTitle: string;
  seoDescription: string;
}

export function ServiceForm({ values }: { values: ServiceFormValues }) {
  return (
    <TaxonomyFormShell
      action={saveServiceAction}
      id={values.id}
      submitLabel={values.id ? "Hizmeti kaydet" : "Hizmet oluştur"}
    >
      {({ formId, errors }) => (
        <>
          <Field id={`${formId}-name`} label="Hizmet adı" required error={errors.name}>
            {(props) => (
              <input {...props} name="name" defaultValue={values.name} maxLength={160} required />
            )}
          </Field>

          <SlugField formId={formId} error={errors.slug} defaultValue={values.slug} />

          <Field
            id={`${formId}-short`}
            label="Kısa açıklama"
            hint="Hizmet kartında görünür. En fazla 400 karakter."
            error={errors.shortDescription}
          >
            {(props) => (
              <textarea
                {...props}
                name="shortDescription"
                defaultValue={values.shortDescription}
                rows={3}
                maxLength={400}
              />
            )}
          </Field>

          <Field id={`${formId}-long`} label="Uzun açıklama" error={errors.longDescription}>
            {(props) => (
              <textarea
                {...props}
                name="longDescription"
                defaultValue={values.longDescription}
                rows={6}
                maxLength={20000}
              />
            )}
          </Field>

          {/*
            SERVİS ÜCRETİ ALANI YOKTUR ve bilinçlidir: ücret §20'de "uydurulamaz"
            listesindedir. Fiyat bilgisi doğrulanınca uzun açıklamaya elle
            yazılır; şemada bir ücret sütunu açmak, boş bırakıldığında "0 TL"
            gibi okunabilecek bir alan yaratırdı.
          */}
          <Field
            id={`${formId}-icon`}
            label="Simge anahtarı"
            hint="Arayüzdeki simge kümesinden bir ad. Emin değilseniz boş bırakın."
            error={errors.iconKey}
          >
            {(props) => (
              <input {...props} name="iconKey" defaultValue={values.iconKey} maxLength={60} />
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <OrderField
              formId={formId}
              error={errors.displayOrder}
              defaultValue={values.displayOrder}
            />
            <StatusField formId={formId} error={errors.status} defaultValue={values.status} />
          </div>

          <Field
            id={`${formId}-seo-title`}
            label="SEO başlığı"
            hint="Boş bırakılırsa hizmet adı kullanılır. En fazla 70 karakter."
            error={errors.seoTitle}
          >
            {(props) => (
              <input {...props} name="seoTitle" defaultValue={values.seoTitle} maxLength={70} />
            )}
          </Field>

          <Field
            id={`${formId}-seo-desc`}
            label="SEO açıklaması"
            hint="En fazla 200 karakter."
            error={errors.seoDescription}
          >
            {(props) => (
              <textarea
                {...props}
                name="seoDescription"
                defaultValue={values.seoDescription}
                rows={3}
                maxLength={200}
              />
            )}
          </Field>
        </>
      )}
    </TaxonomyFormShell>
  );
}
