"use client";

import { useActionState, useId, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { FormFeedback } from "@/components/admin/FormFeedback";
import { PUBLICATION_STATUS_OPTIONS } from "@/components/admin/StatusBadge";
import { availabilityLabels } from "@/components/ui/AvailabilityBadge";
import { saveProductAction } from "@/lib/admin/product-actions";
import { IDLE_ACTION_STATE } from "@/lib/admin/action-result";
import type {
  AvailabilityStatus,
  Marketplace,
  MarketplaceLinkTarget,
  PublicationStatus,
} from "@/lib/data/types";

/*
  ÜRÜN FORMU.

  İstemci bileşeni olmasının sebebi TEK BİR ŞEY: teknik özellik, pazaryeri
  bağlantısı gibi satırların sayısı kullanıcı tarafından değiştirilebiliyor.
  Doğrulama ve kaydetme tamamen sunucuda (`saveProductAction`) yapılır —
  buradaki `required` ve `type` öznitelikleri yalnız erken geri bildirim içindir.

  DİNAMİK SATIRLAR NASIL GÖNDERİLİR: her satır için ayrı input adı üretmek
  (specs[0][label] gibi) sunucu tarafında elle ayrıştırma gerektirirdi. Bunun
  yerine tüm koleksiyon TEK bir gizli alana JSON olarak yazılır ve sunucuda zod
  ile ayrıştırılır. Böylece şema tek kaynaktır ve ayrıştırma hataya kapalıdır.
*/

// --- Formun beslendiği tipler ---------------------------------------------

export interface SpecDraft {
  label: string;
  value: string;
}

export interface MarketplaceLinkDraft {
  marketplace: Marketplace;
  customLabel: string;
  url: string;
  linkTarget: MarketplaceLinkTarget;
  isActive: boolean;
}

export interface ProductFormValues {
  id: string | null;
  name: string;
  slug: string;
  brandId: string;
  categoryId: string;
  sku: string;
  shortDescription: string;
  longDescription: string;
  /** Forma yazılacak hâliyle ("1249,90"). Boş dize = fiyat girilmemiş. */
  price: string;
  compareAtPrice: string;
  availability: AvailabilityStatus;
  /** `null` bilinmiyor demektir; forma "unknown" olarak düşer (bilgi dosyası §20). */
  isOriginal: "unknown" | "original" | "compatible";
  boxContents: string;
  installationNotes: string;
  isFeatured: boolean;
  displayOrder: number;
  status: PublicationStatus;
  seoTitle: string;
  seoDescription: string;
  specs: SpecDraft[];
  compatibleModelIds: string[];
  marketplaceLinks: MarketplaceLinkDraft[];
  relatedProductIds: string[];
}

export interface ProductFormOptions {
  brands: { id: string; name: string }[];
  categories: { id: string; name: string }[];
  deviceModels: { id: string; name: string; brandName: string }[];
  relatedCandidates: { id: string; name: string }[];
}

const AVAILABILITY_OPTIONS: readonly AvailabilityStatus[] = [
  "in_stock",
  "limited",
  "on_order",
  "out_of_stock",
];

/*
  Pazaryeri etiketleri. `other` dışındakiler için görünen ad SABİTTİR — marka
  adının yanlış yazılması güven kaybıdır. `other` seçildiğinde ad zorunlu olur
  (şema kısıtı ve zod refinement aynı kuralı söyler).
*/
const MARKETPLACE_OPTIONS: readonly { value: Marketplace; label: string }[] = [
  { value: "trendyol", label: "Trendyol" },
  { value: "hepsiburada", label: "Hepsiburada" },
  { value: "amazon", label: "Amazon" },
  { value: "pazarama", label: "Pazarama" },
  { value: "other", label: "Diğer (ad girilmeli)" },
];

const EMPTY_LINK: MarketplaceLinkDraft = {
  marketplace: "trendyol",
  customLabel: "",
  url: "",
  linkTarget: "product",
  isActive: true,
};

export function ProductForm({
  values,
  options,
}: {
  values: ProductFormValues;
  options: ProductFormOptions;
}) {
  const [state, formAction] = useActionState(saveProductAction, IDLE_ACTION_STATE);
  const formId = useId();

  const [specs, setSpecs] = useState<SpecDraft[]>(values.specs);
  const [links, setLinks] = useState<MarketplaceLinkDraft[]>(values.marketplaceLinks);
  const [compatible, setCompatible] = useState<string[]>(values.compatibleModelIds);
  const [related, setRelated] = useState<string[]>(values.relatedProductIds);

  const errors = state.fieldErrors;

  function toggle(list: string[], id: string): string[] {
    return list.includes(id) ? list.filter((entry) => entry !== id) : [...list, id];
  }

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {values.id && <input type="hidden" name="id" value={values.id} />}

      {/* Dinamik koleksiyonlar — sunucuda zod ile ayrıştırılır. */}
      <input type="hidden" name="specs" value={JSON.stringify(specs)} />
      <input type="hidden" name="compatibleModelIds" value={JSON.stringify(compatible)} />
      <input
        type="hidden"
        name="marketplaceLinks"
        value={JSON.stringify(
          links.map((link) => ({
            ...link,
            // 'other' dışında görünen ad kullanılmaz; boş gönderilir.
            customLabel: link.marketplace === "other" ? link.customLabel : "",
          })),
        )}
      />
      <input type="hidden" name="relatedProductIds" value={JSON.stringify(related)} />

      <FormFeedback state={state} />

      {/* ---- Temel bilgiler ------------------------------------------- */}
      <Card>
        <fieldset className="flex flex-col gap-4">
          <legend className="text-h4">Temel bilgiler</legend>

          <Field id={`${formId}-name`} label="Ürün adı" required error={errors.name}>
            {(props) => (
              <input {...props} name="name" defaultValue={values.name} maxLength={200} required />
            )}
          </Field>

          <Field
            id={`${formId}-slug`}
            label="Slug (adres)"
            hint="Boş bırakılırsa ürün adından otomatik üretilir. Yayına alınmış bir ürünün slug'ını değiştirmek eski bağlantıları kırar."
            error={errors.slug}
          >
            {(props) => (
              <input
                {...props}
                name="slug"
                defaultValue={values.slug}
                maxLength={200}
                inputMode="url"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="otomatik"
              />
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={`${formId}-brand`} label="Marka" error={errors.brandId}>
              {(props) => (
                <select {...props} name="brandId" defaultValue={values.brandId}>
                  <option value="">Seçilmedi</option>
                  {options.brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field id={`${formId}-category`} label="Kategori" error={errors.categoryId}>
              {(props) => (
                <select {...props} name="categoryId" defaultValue={values.categoryId}>
                  <option value="">Seçilmedi</option>
                  {options.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>

          <Field
            id={`${formId}-sku`}
            label="Ürün kodu (SKU)"
            hint="Benzersizdir. Bilinmiyorsa boş bırakın."
            error={errors.sku}
          >
            {(props) => <input {...props} name="sku" defaultValue={values.sku} maxLength={64} />}
          </Field>

          <Field
            id={`${formId}-short`}
            label="Kısa açıklama"
            hint="Katalog kartında görünür. En fazla 400 karakter."
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

          <Field
            id={`${formId}-long`}
            label="Uzun açıklama"
            hint="Ürün sayfasında görünür."
            error={errors.longDescription}
          >
            {(props) => (
              <textarea
                {...props}
                name="longDescription"
                defaultValue={values.longDescription}
                rows={8}
                maxLength={20000}
              />
            )}
          </Field>
        </fieldset>
      </Card>

      {/* ---- Fiyat ve bulunabilirlik ----------------------------------- */}
      <Card>
        <fieldset className="flex flex-col gap-4">
          <legend className="text-h4">Fiyat ve bulunabilirlik</legend>

          {/*
            FİYAT KURALI (bilgi dosyası §6): boş bırakmak ile 0 yazmak AYNI ŞEY
            DEĞİLDİR. Boş → "Fiyat için iletişime geçin". 0 → veri hatası,
            reddedilir. Bu ayrım hem burada hem `lib/admin/money.ts` içinde hem
            de şemadaki `price_minor > 0` kısıtında yazılıdır.
          */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id={`${formId}-price`}
              label="Fiyat (TL)"
              hint='Boş bırakılırsa sitede "Fiyat için iletişime geçin" gösterilir. Sıfır geçerli bir fiyat değildir.'
              error={errors.priceMinor}
            >
              {(props) => (
                <input
                  {...props}
                  name="price"
                  defaultValue={values.price}
                  inputMode="decimal"
                  placeholder="örn. 1249,90"
                />
              )}
            </Field>

            <Field
              id={`${formId}-compare`}
              label="Eski fiyat (TL)"
              hint="Yalnız gerçek bir indirim varsa doldurun; güncel fiyattan büyük olmalıdır."
              error={errors.compareAtPriceMinor}
            >
              {(props) => (
                <input
                  {...props}
                  name="compareAtPrice"
                  defaultValue={values.compareAtPrice}
                  inputMode="decimal"
                />
              )}
            </Field>
          </div>

          <Field
            id={`${formId}-availability`}
            label="Bulunabilirlik"
            required
            error={errors.availability}
          >
            {(props) => (
              <select {...props} name="availability" defaultValue={values.availability}>
                {AVAILABILITY_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {availabilityLabels[status]}
                  </option>
                ))}
              </select>
            )}
          </Field>

          {/*
            ORİJİNAL / UYUMLU: üçüncü seçenek "bilinmiyor"dur ve VARSAYILANDIR.
            Doğrulanmamış bir uyumluluk iddiası uydurmak §20'nin yasakladığı
            şeydir; bu yüzden alan zorunlu bir ikili seçim DEĞİLDİR.
          */}
          <fieldset className="flex flex-col gap-2">
            <legend className="text-caption font-semibold text-text">Orijinal / uyumlu</legend>
            {(
              [
                { value: "unknown", label: "Bilinmiyor (doğrulanmadı) — sitede gösterilmez" },
                { value: "original", label: "Orijinal" },
                { value: "compatible", label: "Uyumlu (muadil)" },
              ] as const
            ).map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-body">
                <input
                  type="radio"
                  name="isOriginal"
                  value={option.value}
                  defaultChecked={values.isOriginal === option.value}
                  className="size-4"
                />
                {option.label}
              </label>
            ))}
          </fieldset>
        </fieldset>
      </Card>

      {/* ---- Teknik özellikler ----------------------------------------- */}
      <Card>
        <fieldset className="flex flex-col gap-4">
          <legend className="text-h4">Teknik özellikler</legend>
          <p className="text-caption text-text-muted">
            Yalnız DOĞRULANMIŞ bilgi girin. Emin olmadığınız bir özelliği boş bırakmak, yanlış
            yazmaktan iyidir.
          </p>

          {specs.length === 0 && (
            <p className="text-caption text-text-muted">Henüz özellik eklenmedi.</p>
          )}

          <ul className="flex flex-col gap-3">
            {specs.map((spec, index) => (
              <li key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <Field id={`${formId}-spec-label-${index}`} label="Özellik">
                  {(props) => (
                    <input
                      {...props}
                      value={spec.label}
                      maxLength={120}
                      onChange={(event) =>
                        setSpecs((current) =>
                          current.map((entry, position) =>
                            position === index ? { ...entry, label: event.target.value } : entry,
                          ),
                        )
                      }
                    />
                  )}
                </Field>

                <Field id={`${formId}-spec-value-${index}`} label="Değer">
                  {(props) => (
                    <input
                      {...props}
                      value={spec.value}
                      maxLength={500}
                      onChange={(event) =>
                        setSpecs((current) =>
                          current.map((entry, position) =>
                            position === index ? { ...entry, value: event.target.value } : entry,
                          ),
                        )
                      }
                    />
                  )}
                </Field>

                <Button
                  variant="secondary"
                  size="sm"
                  aria-label={`${index + 1}. özelliği kaldır`}
                  onClick={() =>
                    setSpecs((current) => current.filter((_, position) => position !== index))
                  }
                >
                  Kaldır
                </Button>
              </li>
            ))}
          </ul>

          <div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSpecs((current) => [...current, { label: "", value: "" }])}
            >
              Özellik ekle
            </Button>
          </div>
        </fieldset>
      </Card>

      {/* ---- Uyumlu cihaz modelleri ------------------------------------ */}
      <Card>
        <fieldset className="flex flex-col gap-4">
          <legend className="text-h4">Uyumlu cihaz modelleri</legend>
          <p className="text-caption text-text-muted">
            Uyumluluk DOĞRULANMIŞ bir iddiadır (bilgi dosyası §20). Yalnız gerçekten test edilmiş
            veya üreticinin belgelediği modelleri işaretleyin.
          </p>

          {options.deviceModels.length === 0 ? (
            <p className="text-caption text-text-muted">
              Tanımlı cihaz modeli yok.{" "}
              <Link href="/admin/cihaz-modelleri" className="text-link underline">
                Cihaz modeli ekleyin
              </Link>
              .
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {options.deviceModels.map((model) => (
                <li key={model.id}>
                  <label className="flex items-center gap-2 text-body">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={compatible.includes(model.id)}
                      onChange={() => setCompatible((current) => toggle(current, model.id))}
                    />
                    <span>
                      {model.name}
                      <span className="text-text-muted"> · {model.brandName}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
      </Card>

      {/* ---- Pazaryeri bağlantıları ------------------------------------ */}
      <Card>
        <fieldset className="flex flex-col gap-4">
          <legend className="text-h4">Pazaryeri bağlantıları</legend>
          {/*
            KURAL (CLAUDE.md): "Pazaryeri bağlantısı yoksa o pazaryerinin butonu
            HİÇ gösterilmez." Bu yüzden burada boş bir bağlantı satırı
            bırakmanın anlamı yoktur — satır ya doldurulur ya kaldırılır.
          */}
          <p className="text-caption text-text-muted">
            Bağlantı girilmeyen pazaryerinin butonu sitede hiç gösterilmez. Bağlantılar{" "}
            <code>https://</code> ile başlamalıdır.
          </p>

          {links.length === 0 && (
            <p className="text-caption text-text-muted">Henüz bağlantı eklenmedi.</p>
          )}

          <ul className="flex flex-col gap-4">
            {links.map((link, index) => (
              <li
                key={index}
                className="flex flex-col gap-3 rounded-md border border-border p-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id={`${formId}-mp-${index}`} label="Pazaryeri">
                    {(props) => (
                      <select
                        {...props}
                        value={link.marketplace}
                        onChange={(event) =>
                          setLinks((current) =>
                            current.map((entry, position) =>
                              position === index
                                ? { ...entry, marketplace: event.target.value as Marketplace }
                                : entry,
                            ),
                          )
                        }
                      >
                        {MARKETPLACE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>

                  <Field id={`${formId}-mp-target-${index}`} label="Bağlantı hedefi">
                    {(props) => (
                      <select
                        {...props}
                        value={link.linkTarget}
                        onChange={(event) =>
                          setLinks((current) =>
                            current.map((entry, position) =>
                              position === index
                                ? {
                                    ...entry,
                                    linkTarget: event.target.value as MarketplaceLinkTarget,
                                  }
                                : entry,
                            ),
                          )
                        }
                      >
                        <option value="product">Ürün sayfası</option>
                        <option value="store">Mağaza sayfası</option>
                      </select>
                    )}
                  </Field>
                </div>

                {link.marketplace === "other" && (
                  <Field
                    id={`${formId}-mp-label-${index}`}
                    label="Görünen ad"
                    required
                    hint='"Diğer" seçildiğinde zorunludur — buton üzerinde bu ad yazar.'
                  >
                    {(props) => (
                      <input
                        {...props}
                        value={link.customLabel}
                        maxLength={60}
                        onChange={(event) =>
                          setLinks((current) =>
                            current.map((entry, position) =>
                              position === index
                                ? { ...entry, customLabel: event.target.value }
                                : entry,
                            ),
                          )
                        }
                      />
                    )}
                  </Field>
                )}

                <Field id={`${formId}-mp-url-${index}`} label="Bağlantı (https://)" required>
                  {(props) => (
                    <input
                      {...props}
                      type="url"
                      value={link.url}
                      maxLength={2000}
                      placeholder="https://"
                      onChange={(event) =>
                        setLinks((current) =>
                          current.map((entry, position) =>
                            position === index ? { ...entry, url: event.target.value } : entry,
                          ),
                        )
                      }
                    />
                  )}
                </Field>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-body">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={link.isActive}
                      onChange={() =>
                        setLinks((current) =>
                          current.map((entry, position) =>
                            position === index ? { ...entry, isActive: !entry.isActive } : entry,
                          ),
                        )
                      }
                    />
                    Sitede göster
                  </label>

                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={`${index + 1}. pazaryeri bağlantısını kaldır`}
                    onClick={() =>
                      setLinks((current) => current.filter((_, position) => position !== index))
                    }
                  >
                    Kaldır
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          <div>
            <Button
              variant="secondary"
              size="sm"
              disabled={links.length >= MARKETPLACE_OPTIONS.length}
              onClick={() => setLinks((current) => [...current, { ...EMPTY_LINK }])}
            >
              Bağlantı ekle
            </Button>
          </div>
        </fieldset>
      </Card>

      {/* ---- İlgili ürünler -------------------------------------------- */}
      <Card>
        <fieldset className="flex flex-col gap-4">
          <legend className="text-h4">İlgili ürünler</legend>
          <p className="text-caption text-text-muted">
            Ürün sayfasının altında önerilir. En fazla 20 ürün seçilebilir.
          </p>

          {options.relatedCandidates.length === 0 ? (
            <p className="text-caption text-text-muted">Seçilebilecek başka ürün yok.</p>
          ) : (
            <ul className="grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
              {options.relatedCandidates.map((candidate) => (
                <li key={candidate.id}>
                  <label className="flex items-center gap-2 text-body">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={related.includes(candidate.id)}
                      onChange={() => setRelated((current) => toggle(current, candidate.id))}
                    />
                    {candidate.name}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
      </Card>

      {/* ---- Yayın ve SEO ---------------------------------------------- */}
      <Card>
        <fieldset className="flex flex-col gap-4">
          <legend className="text-h4">Yayın ve SEO</legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={`${formId}-status`} label="Yayın durumu" required error={errors.status}>
              {(props) => (
                <select {...props} name="status" defaultValue={values.status}>
                  {PUBLICATION_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field
              id={`${formId}-order`}
              label="Sıra"
              hint="Küçük sayı önce gösterilir."
              error={errors.displayOrder}
            >
              {(props) => (
                <input
                  {...props}
                  name="displayOrder"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={values.displayOrder}
                />
              )}
            </Field>
          </div>

          <label className="flex items-center gap-2 text-body">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={values.isFeatured}
              className="size-4"
            />
            Öne çıkan ürün
          </label>

          <Field
            id={`${formId}-seo-title`}
            label="SEO başlığı"
            hint="Boş bırakılırsa ürün adı kullanılır. En fazla 70 karakter."
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

          <Field
            id={`${formId}-box`}
            label="Kutu içeriği"
            error={errors.boxContents}
          >
            {(props) => (
              <textarea
                {...props}
                name="boxContents"
                defaultValue={values.boxContents}
                rows={3}
                maxLength={2000}
              />
            )}
          </Field>

          <Field
            id={`${formId}-install`}
            label="Montaj notları"
            error={errors.installationNotes}
          >
            {(props) => (
              <textarea
                {...props}
                name="installationNotes"
                defaultValue={values.installationNotes}
                rows={4}
                maxLength={4000}
              />
            )}
          </Field>
        </fieldset>
      </Card>

      <div className="flex flex-wrap gap-3">
        <SubmitButton pendingLabel="Kaydediliyor…">
          {values.id ? "Değişiklikleri kaydet" : "Ürünü oluştur"}
        </SubmitButton>
        <Link
          href="/admin/urunler"
          className="inline-flex min-h-11 items-center rounded-md px-4 py-2.5 text-body font-semibold text-link underline underline-offset-4 hover:text-link-hover"
        >
          Vazgeç
        </Link>
      </div>
    </form>
  );
}
