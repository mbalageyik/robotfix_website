"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { AlertCircleIcon } from "@/components/ui/icons";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { FormFeedback } from "@/components/admin/FormFeedback";
import { PUBLICATION_STATUS_OPTIONS } from "@/components/admin/StatusBadge";
import { availabilityLabels } from "@/components/ui/AvailabilityBadge";
import { saveProductAction, type ProductActionState } from "@/lib/admin/product-actions";
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

  ============================================================================
  DOĞRULAMA HATASINDA VERİ NEDEN KAYBOLMUYOR
  ============================================================================

  React, `<form action={fn}>` ile yapılan HER gönderimden sonra formu otomatik
  sıfırlar (`requestFormReset` → `form.reset()`). Kontrolsüz alanlar (yalnız
  `defaultValue` ile beslenenler) böylece boşalır; onay kutuları ve radyolar ise
  DOM'da bağlandıkları anki hâllerine döner ve React durumuyla ÇELİŞİR — o an
  kullanıcı ekranda işaretsiz bir kutu görürken kayıt işaretli gider.

  İki katmanla kapatıldı:
    1. Tüm alanlar KONTROLLÜ; tek bir `draft` durumu formun tamamını taşır.
    2. Otomatik sıfırlama `onReset` ile iptal edilir (`reset` olayı iptal
       edilebilir bir olaydır). Formun kendi sıfırlama düğmesi yoktur, bu
       yüzden iptal edilecek meşru bir sıfırlama da yoktur.

  Üçüncü emniyet sunucudadır: aksiyon, aldığı değerleri `state.values` ile geri
  gönderir ve form onları yeniden basar. Böylece bileşen yeniden bağlansa bile
  veri sunucudan geri gelir. Tarayıcı deposu KULLANILMAZ.
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
  /** Metin olarak tutulur: kullanıcı alanı boşaltabilmeli, `NaN` üretmemeli. */
  displayOrder: string;
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

// --- Hata anahtarı → alan eşlemesi ----------------------------------------

/*
  Sunucu hataları NOKTALI YOL anahtarlarıyla gelir (`specs.1.value`). Aşağıdaki
  eşlemeler bu anahtarı iki şeye çevirir: kullanıcıya gösterilecek ALAN ADI ve
  odaklanılacak KONTROL KİMLİĞİ. İkisi de tek yerde durur ki bir alanın kimliği
  değiştiğinde hata bağlantısı sessizce kopmasın.
*/

/** Temel alanlar: hata anahtarı → kontrol kimliğinin soneki. */
const SCALAR_FIELD_IDS: Record<string, string> = {
  name: "name",
  slug: "slug",
  brandId: "brand",
  categoryId: "category",
  sku: "sku",
  shortDescription: "short",
  longDescription: "long",
  priceMinor: "price",
  compareAtPriceMinor: "compare",
  availability: "availability",
  isOriginal: "is-original-error",
  displayOrder: "order",
  status: "status",
  seoTitle: "seo-title",
  seoDescription: "seo-desc",
  boxContents: "box",
  installationNotes: "install",
};

/** Özetin okunabilir olması için: hata anahtarı → alanın ekrandaki adı. */
const SCALAR_FIELD_LABELS: Record<string, string> = {
  name: "Ürün adı",
  slug: "Slug (adres)",
  brandId: "Marka",
  categoryId: "Kategori",
  sku: "Ürün kodu (SKU)",
  shortDescription: "Kısa açıklama",
  longDescription: "Uzun açıklama",
  priceMinor: "Fiyat (TL)",
  compareAtPriceMinor: "Eski fiyat (TL)",
  availability: "Bulunabilirlik",
  isOriginal: "Orijinal / uyumlu",
  displayOrder: "Sıra",
  status: "Yayın durumu",
  seoTitle: "SEO başlığı",
  seoDescription: "SEO açıklaması",
  boxContents: "Kutu içeriği",
  installationNotes: "Montaj notları",
};

const LINK_SUBFIELDS: Record<string, { label: string; idPrefix: string }> = {
  marketplace: { label: "Pazaryeri", idPrefix: "mp" },
  linkTarget: { label: "Bağlantı hedefi", idPrefix: "mp-target" },
  customLabel: { label: "Görünen ad", idPrefix: "mp-label" },
  url: { label: "Bağlantı", idPrefix: "mp-url" },
};

/** Özet listesinin ekrandaki sırayla akması için kök anahtar sıralaması. */
const ERROR_ROOT_ORDER = [
  "name",
  "slug",
  "brandId",
  "categoryId",
  "sku",
  "shortDescription",
  "longDescription",
  "priceMinor",
  "compareAtPriceMinor",
  "availability",
  "isOriginal",
  "specs",
  "compatibleModelIds",
  "marketplaceLinks",
  "relatedProductIds",
  "status",
  "displayOrder",
  "seoTitle",
  "seoDescription",
  "boxContents",
  "installationNotes",
];

interface ErrorTarget {
  /** Kullanıcıya gösterilecek alan adı. */
  label: string;
  /** Odaklanılacak kontrolün kimliği (formId öneki olmadan). */
  idSuffix: string;
}

function describeErrorKey(key: string): ErrorTarget {
  const [root, index, sub] = key.split(".");
  const rowNumber = index === undefined ? null : Number(index) + 1;

  if (root === "specs") {
    if (rowNumber === null) return { label: "Teknik özellikler", idSuffix: "specs-error" };
    if (sub === "label") {
      return { label: `${rowNumber}. teknik özellik · Özellik`, idSuffix: `spec-label-${index}` };
    }
    if (sub === "value") {
      return { label: `${rowNumber}. teknik özellik · Değer`, idSuffix: `spec-value-${index}` };
    }
    return { label: `${rowNumber}. teknik özellik`, idSuffix: `spec-label-${index}` };
  }

  if (root === "marketplaceLinks") {
    if (rowNumber === null) return { label: "Pazaryeri bağlantıları", idSuffix: "links-error" };
    const subField = sub === undefined ? undefined : LINK_SUBFIELDS[sub];
    if (subField) {
      return {
        label: `${rowNumber}. pazaryeri bağlantısı · ${subField.label}`,
        idSuffix: `${subField.idPrefix}-${index}`,
      };
    }
    return { label: `${rowNumber}. pazaryeri bağlantısı`, idSuffix: `mp-${index}` };
  }

  if (root === "compatibleModelIds") {
    return { label: "Uyumlu cihaz modelleri", idSuffix: "compat-error" };
  }

  if (root === "relatedProductIds") {
    return { label: "İlgili ürünler", idSuffix: "related-error" };
  }

  const scalarId = SCALAR_FIELD_IDS[root];
  if (scalarId) return { label: SCALAR_FIELD_LABELS[root] ?? root, idSuffix: scalarId };

  return { label: "Form", idSuffix: "form-error" };
}

/** Özet listesini ekran sırasına dizer: önce bölüm, sonra satır, sonra alan. */
function compareErrorKeys(a: string, b: string): number {
  const [rootA, indexA = "", subA = ""] = a.split(".");
  const [rootB, indexB = "", subB = ""] = b.split(".");

  const rankA = ERROR_ROOT_ORDER.indexOf(rootA);
  const rankB = ERROR_ROOT_ORDER.indexOf(rootB);
  const safeA = rankA === -1 ? ERROR_ROOT_ORDER.length : rankA;
  const safeB = rankB === -1 ? ERROR_ROOT_ORDER.length : rankB;
  if (safeA !== safeB) return safeA - safeB;

  const rowA = indexA === "" ? -1 : Number(indexA);
  const rowB = indexB === "" ? -1 : Number(indexB);
  if (rowA !== rowB) return rowA - rowB;

  return subA.localeCompare(subB);
}

// --- Bölüm düzeyi hata kutusu ---------------------------------------------

/*
  Bir satıra/kontrole bağlanamayan hatalar (bölüm sınırları, okunamayan
  koleksiyon) burada gösterilir. `tabIndex={-1}` verilmesinin sebebi
  odaklanabilir olması: otomatik kaydırma ilk hatalı ÖĞEYE odaklanır ve bu
  öğenin bir input olması şart değildir.
*/
function SectionError({ id, message }: { id: string; message: string | undefined }) {
  if (!message) return null;
  return (
    <p
      id={id}
      tabIndex={-1}
      data-error-anchor="true"
      className="flex items-start gap-1.5 rounded-md border border-danger/35 bg-danger/8 p-3 text-caption font-medium text-danger outline-offset-2"
    >
      <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
      <span>
        <span className="sr-only">Hata: </span>
        {message}
      </span>
    </p>
  );
}

export function ProductForm({
  values,
  options,
}: {
  values: ProductFormValues;
  options: ProductFormOptions;
}) {
  const [state, formAction] = useActionState<ProductActionState, FormData>(
    saveProductAction,
    IDLE_ACTION_STATE,
  );
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);

  /*
    FORMUN TAMAMI TEK BİR DURUMDA. Alanların hepsi kontrollü olduğu için
    React'in otomatik sıfırlaması kullanıcı verisini silemez ve gönderim
    sonrası dönen değerler tek atamayla geri basılabilir.
  */
  const [draft, setDraft] = useState<ProductFormValues>(values);

  /*
    Aksiyondan yeni bir sonuç geldiğinde gönderilen değerleri geri bas.
    Render sırasında yapılır (React'in "türetilmiş durumu ayarla" deseni):
    efekt ile yapılsaydı kullanıcı bir kare boyunca eski/boş formu görürdü.
    `state` her gönderimde YENİ bir nesnedir, bu yüzden karşılaştırma güvenli.
  */
  const [seenState, setSeenState] = useState<ProductActionState>(state);
  if (seenState !== state) {
    setSeenState(state);
    if (state.values) setDraft(state.values);
  }

  const errors = state.fieldErrors;
  const errorKeys = Object.keys(errors).sort(compareErrorKeys);
  const hasFieldErrors = errorKeys.length > 0;

  /*
    OTOMATİK KAYDIRMA VE ODAK.

    İlk hatalı öğe DOM'dan sorgulanır, hata haritasından değil: DOM sırası
    ekranda gördüğümüz sıradır ve satır/alan sıralamasını ayrıca hesaplamak
    gerekmez. Hiçbir alana bağlanamayan bir hata varsa (veritabanı hatası,
    yetki hatası) odak üstteki bildirim kutusuna gider — kullanıcı hiçbir
    zaman "bir şey oldu ama nerede" durumunda kalmaz.
  */
  useEffect(() => {
    if (state.status === "idle") return;
    const form = formRef.current;
    if (!form) return;

    const target =
      state.status === "error"
        ? form.querySelector<HTMLElement>('[aria-invalid="true"], [data-error-anchor="true"]')
        : null;
    const focusTarget = target ?? feedbackRef.current;
    if (!focusTarget) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    focusTarget.scrollIntoView({
      block: "center",
      behavior: reduceMotion ? "auto" : "smooth",
    });
    focusTarget.focus({ preventScroll: true });
  }, [state]);

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateSpec(index: number, patch: Partial<SpecDraft>) {
    setDraft((current) => ({
      ...current,
      specs: current.specs.map((entry, position) =>
        position === index ? { ...entry, ...patch } : entry,
      ),
    }));
  }

  function updateLink(index: number, patch: Partial<MarketplaceLinkDraft>) {
    setDraft((current) => ({
      ...current,
      marketplaceLinks: current.marketplaceLinks.map((entry, position) =>
        position === index ? { ...entry, ...patch } : entry,
      ),
    }));
  }

  function toggleId(key: "compatibleModelIds" | "relatedProductIds", id: string) {
    setDraft((current) => {
      const list = current[key];
      return {
        ...current,
        [key]: list.includes(id) ? list.filter((entry) => entry !== id) : [...list, id],
      };
    });
  }

  function focusErrorTarget(idSuffix: string) {
    // Hedef bulunamazsa (beklenmedik bir hata anahtarı) odak özet kutusunda
    // kalır; tıklamanın hiçbir şey yapmaması en kötü sonuçtur.
    const element = document.getElementById(`${formId}-${idSuffix}`) ?? feedbackRef.current;
    if (!element) return;
    element.scrollIntoView({ block: "center" });
    element.focus({ preventScroll: true });
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-6"
      noValidate
      /*
        React'in gönderim sonrası otomatik sıfırlaması burada iptal edilir
        (dosya başlığındaki gerekçe). `reset` olayı iptal edilebilir bir
        olaydır; formun meşru bir sıfırlama düğmesi yoktur.
      */
      onReset={(event) => event.preventDefault()}
    >
      {draft.id && <input type="hidden" name="id" value={draft.id} />}

      {/* Dinamik koleksiyonlar — sunucuda zod ile ayrıştırılır. */}
      <input type="hidden" name="specs" value={JSON.stringify(draft.specs)} />
      <input
        type="hidden"
        name="compatibleModelIds"
        value={JSON.stringify(draft.compatibleModelIds)}
      />
      <input
        type="hidden"
        name="marketplaceLinks"
        value={JSON.stringify(
          draft.marketplaceLinks.map((link) => ({
            ...link,
            // 'other' dışında görünen ad kullanılmaz; boş gönderilir.
            customLabel: link.marketplace === "other" ? link.customLabel : "",
          })),
        )}
      />
      <input
        type="hidden"
        name="relatedProductIds"
        value={JSON.stringify(draft.relatedProductIds)}
      />

      {/*
        ÜSTTEKİ KUTU YALNIZ ÖZETTİR. Her hatanın asıl açıklaması kendi alanının
        yanındadır; buradaki liste sayfanın neresinde ne olduğunu gösterir ve
        tek tıkla oraya götürür. Uzun bir formda ekranın dışında kalan bir
        hatayı bulmanın tek pratik yolu budur.
      */}
      <div ref={feedbackRef} tabIndex={-1} className="flex flex-col gap-2 outline-offset-4">
        <FormFeedback state={state} />

        {state.status === "error" && hasFieldErrors && (
          <ul className="flex flex-col gap-1 rounded-lg border border-danger/35 bg-danger/8 p-4 text-caption text-danger">
            {errorKeys.map((key) => {
              const target = describeErrorKey(key);
              return (
                <li key={key} className="flex flex-wrap items-baseline gap-x-1.5">
                  <button
                    type="button"
                    onClick={() => focusErrorTarget(target.idSuffix)}
                    className="font-semibold underline underline-offset-2 hover:no-underline"
                  >
                    {target.label}
                  </button>
                  <span>— {errors[key]}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ---- Temel bilgiler ------------------------------------------- */}
      <Card>
        <fieldset className="flex flex-col gap-4">
          <legend className="text-h4">Temel bilgiler</legend>

          <Field id={`${formId}-name`} label="Ürün adı" required error={errors.name}>
            {(props) => (
              <input
                {...props}
                name="name"
                value={draft.name}
                onChange={(event) => update("name", event.target.value)}
                maxLength={200}
                required
              />
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
                value={draft.slug}
                onChange={(event) => update("slug", event.target.value)}
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
                <select
                  {...props}
                  name="brandId"
                  value={draft.brandId}
                  onChange={(event) => update("brandId", event.target.value)}
                >
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
                <select
                  {...props}
                  name="categoryId"
                  value={draft.categoryId}
                  onChange={(event) => update("categoryId", event.target.value)}
                >
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
            {(props) => (
              <input
                {...props}
                name="sku"
                value={draft.sku}
                onChange={(event) => update("sku", event.target.value)}
                maxLength={64}
              />
            )}
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
                value={draft.shortDescription}
                onChange={(event) => update("shortDescription", event.target.value)}
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
                value={draft.longDescription}
                onChange={(event) => update("longDescription", event.target.value)}
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
                  value={draft.price}
                  onChange={(event) => update("price", event.target.value)}
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
                  value={draft.compareAtPrice}
                  onChange={(event) => update("compareAtPrice", event.target.value)}
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
              <select
                {...props}
                name="availability"
                value={draft.availability}
                onChange={(event) =>
                  update("availability", event.target.value as AvailabilityStatus)
                }
              >
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
            <SectionError id={`${formId}-is-original-error`} message={errors.isOriginal} />
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
                  checked={draft.isOriginal === option.value}
                  onChange={() => update("isOriginal", option.value)}
                  aria-describedby={
                    errors.isOriginal ? `${formId}-is-original-error` : undefined
                  }
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
            yazmaktan iyidir. Eklenen her satırın hem adı hem değeri dolu olmalıdır; boş kalan
            bir satırı kaydetmek yerine kaldırın.
          </p>

          <SectionError id={`${formId}-specs-error`} message={errors.specs} />

          {draft.specs.length === 0 && (
            <p className="text-caption text-text-muted">Henüz özellik eklenmedi.</p>
          )}

          <ul className="flex flex-col gap-3">
            {draft.specs.map((spec, index) => (
              <li key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <Field
                  id={`${formId}-spec-label-${index}`}
                  label={`${index + 1}. özellik`}
                  error={errors[`specs.${index}.label`] ?? errors[`specs.${index}`]}
                >
                  {(props) => (
                    <input
                      {...props}
                      value={spec.label}
                      maxLength={120}
                      onChange={(event) => updateSpec(index, { label: event.target.value })}
                    />
                  )}
                </Field>

                <Field
                  id={`${formId}-spec-value-${index}`}
                  label="Değer"
                  error={errors[`specs.${index}.value`]}
                >
                  {(props) => (
                    <input
                      {...props}
                      value={spec.value}
                      maxLength={500}
                      onChange={(event) => updateSpec(index, { value: event.target.value })}
                    />
                  )}
                </Field>

                <Button
                  variant="secondary"
                  size="sm"
                  aria-label={`${index + 1}. özelliği kaldır`}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      specs: current.specs.filter((_, position) => position !== index),
                    }))
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
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  specs: [...current.specs, { label: "", value: "" }],
                }))
              }
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

          <SectionError
            id={`${formId}-compat-error`}
            message={
              errors.compatibleModelIds ??
              errorKeys
                .filter((key) => key.startsWith("compatibleModelIds."))
                .map((key) => errors[key])[0]
            }
          />

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
                      checked={draft.compatibleModelIds.includes(model.id)}
                      onChange={() => toggleId("compatibleModelIds", model.id)}
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

          <SectionError id={`${formId}-links-error`} message={errors.marketplaceLinks} />

          {draft.marketplaceLinks.length === 0 && (
            <p className="text-caption text-text-muted">Henüz bağlantı eklenmedi.</p>
          )}

          <ul className="flex flex-col gap-4">
            {draft.marketplaceLinks.map((link, index) => (
              <li
                key={index}
                className="flex flex-col gap-3 rounded-md border border-border p-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    id={`${formId}-mp-${index}`}
                    label={`${index + 1}. bağlantı · Pazaryeri`}
                    error={
                      errors[`marketplaceLinks.${index}.marketplace`] ??
                      errors[`marketplaceLinks.${index}`]
                    }
                  >
                    {(props) => (
                      <select
                        {...props}
                        value={link.marketplace}
                        onChange={(event) =>
                          updateLink(index, {
                            marketplace: event.target.value as Marketplace,
                          })
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

                  <Field
                    id={`${formId}-mp-target-${index}`}
                    label="Bağlantı hedefi"
                    error={errors[`marketplaceLinks.${index}.linkTarget`]}
                  >
                    {(props) => (
                      <select
                        {...props}
                        value={link.linkTarget}
                        onChange={(event) =>
                          updateLink(index, {
                            linkTarget: event.target.value as MarketplaceLinkTarget,
                          })
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
                    error={errors[`marketplaceLinks.${index}.customLabel`]}
                  >
                    {(props) => (
                      <input
                        {...props}
                        value={link.customLabel}
                        maxLength={60}
                        onChange={(event) =>
                          updateLink(index, { customLabel: event.target.value })
                        }
                      />
                    )}
                  </Field>
                )}

                <Field
                  id={`${formId}-mp-url-${index}`}
                  label="Bağlantı (https://)"
                  required
                  error={errors[`marketplaceLinks.${index}.url`]}
                >
                  {(props) => (
                    <input
                      {...props}
                      type="url"
                      value={link.url}
                      maxLength={2000}
                      placeholder="https://"
                      onChange={(event) => updateLink(index, { url: event.target.value })}
                    />
                  )}
                </Field>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-body">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={link.isActive}
                      onChange={() => updateLink(index, { isActive: !link.isActive })}
                    />
                    Sitede göster
                  </label>

                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={`${index + 1}. pazaryeri bağlantısını kaldır`}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        marketplaceLinks: current.marketplaceLinks.filter(
                          (_, position) => position !== index,
                        ),
                      }))
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
              disabled={draft.marketplaceLinks.length >= MARKETPLACE_OPTIONS.length}
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  marketplaceLinks: [...current.marketplaceLinks, { ...EMPTY_LINK }],
                }))
              }
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

          <SectionError
            id={`${formId}-related-error`}
            message={
              errors.relatedProductIds ??
              errorKeys
                .filter((key) => key.startsWith("relatedProductIds."))
                .map((key) => errors[key])[0]
            }
          />

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
                      checked={draft.relatedProductIds.includes(candidate.id)}
                      onChange={() => toggleId("relatedProductIds", candidate.id)}
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
                <select
                  {...props}
                  name="status"
                  value={draft.status}
                  onChange={(event) => update("status", event.target.value as PublicationStatus)}
                >
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
                  value={draft.displayOrder}
                  onChange={(event) => update("displayOrder", event.target.value)}
                />
              )}
            </Field>
          </div>

          {/*
            SEÇKİ KUTUCUĞU.

            Etiket, ana sayfada BASILAN adla aynıdır. Eskiden "Öne çıkan ürün"
            yazıyordu; sitede ise bölümün adı "Robot Fix Seçkisi". Aynı kavramın
            iki yerde iki farklı adı olması, yöneticinin alanı arayıp
            bulamamasının sebebiydi.

            Yardım metni de yeni: kutucuk çıplak bir `<label>` idi, formdaki
            diğer alanların aksine ne açıklaması ne de `aria-describedby`
            bağlantısı vardı — ne işe yaradığı hiçbir yerde yazmıyordu.
          */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 text-body">
              <input
                type="checkbox"
                name="isFeatured"
                checked={draft.isFeatured}
                onChange={(event) => update("isFeatured", event.target.checked)}
                aria-describedby={`${formId}-featured-hint`}
                className="size-4"
              />
              Robot Fix Seçkisi&rsquo;nde göster
            </label>
            <p id={`${formId}-featured-hint`} className="text-caption text-text-muted">
              Ana sayfadaki &laquo;Robot Fix Seçkisi&raquo; bölümünde gösterilir. Sıralama
              yukarıdaki <strong className="font-semibold text-text">Sıra</strong> alanından
              gelir. Yalnız yayına alınmış ürünler görünür. Seçkinin tamamını tek ekrandan
              yönetmek için:{" "}
              <Link href="/admin/secki" className="text-link underline underline-offset-2">
                Seçki sayfası
              </Link>
              .
            </p>
          </div>

          <Field
            id={`${formId}-seo-title`}
            label="SEO başlığı"
            hint="Boş bırakılırsa ürün adı kullanılır. En fazla 70 karakter."
            error={errors.seoTitle}
          >
            {(props) => (
              <input
                {...props}
                name="seoTitle"
                value={draft.seoTitle}
                onChange={(event) => update("seoTitle", event.target.value)}
                maxLength={70}
              />
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
                value={draft.seoDescription}
                onChange={(event) => update("seoDescription", event.target.value)}
                rows={3}
                maxLength={200}
              />
            )}
          </Field>

          <Field id={`${formId}-box`} label="Kutu içeriği" error={errors.boxContents}>
            {(props) => (
              <textarea
                {...props}
                name="boxContents"
                value={draft.boxContents}
                onChange={(event) => update("boxContents", event.target.value)}
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
                value={draft.installationNotes}
                onChange={(event) => update("installationNotes", event.target.value)}
                rows={4}
                maxLength={4000}
              />
            )}
          </Field>
        </fieldset>
      </Card>

      <div className="flex flex-wrap gap-3">
        <SubmitButton pendingLabel="Kaydediliyor…">
          {draft.id ? "Değişiklikleri kaydet" : "Ürünü oluştur"}
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
