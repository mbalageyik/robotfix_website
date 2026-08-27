"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminAction } from "@/lib/auth/dal";
import { getServerClient } from "@/lib/supabase/server-client";
import { resolveSlug } from "@/lib/admin/slug";
import { revalidateProductSurfaces } from "@/lib/admin/revalidate";
import {
  productSchema,
  productSubResourcesSchema,
  publicationStatusSchema,
} from "@/lib/admin/schemas";
import {
  parseCollectionField,
  productFormValuesFromFormData,
} from "@/lib/admin/product-form-input";
import {
  actionError,
  actionSuccess,
  fieldErrorsFromZodIssues,
  messageFromPostgresError,
  type ActionState,
} from "@/lib/admin/action-result";
import type { ProductFormValues } from "@/components/admin/ProductForm";

/*
  ÜRÜN YAZMA AKSİYONLARI.

  HER aksiyon `requireAdminAction()` ile BAŞLAR. Formun yalnız yetkili bir
  sayfada render edilmiş olması güvenlik sınırı değildir: aksiyon uç noktasına
  arayüzden geçmeden istek gönderilebilir.

  CSRF: Next.js `Origin`/`Host` karşılaştırmasını kendi yapar (bkz.
  lib/auth/actions.ts başlığı). Ek mekanizma yazılmadı.

  Doğrulama sırası: yetki → şema → veritabanı. Üçü de bağımsız hattır.
*/

/** Ürün formunun aksiyon sonucu — hata hâlinde gönderilen değerleri geri taşır. */
export type ProductActionState = ActionState<ProductFormValues>;

/**
 * Benzersizlik ihlalini SORUMLU ALANA bağlar.
 *
 * Genel mesaj tek başına yetmez: uzun bir formda "bu kayıt zaten mevcut"
 * cümlesi kullanıcıya hangi kutuyu değiştireceğini söylemez.
 */
function uniqueFieldErrors(error: { code?: string; message: string }): Record<string, string> {
  if (error.code !== "23505") return {};
  if (error.message.includes("slug")) {
    return { slug: "Bu slug zaten kullanılıyor. Farklı bir slug yazın." };
  }
  if (error.message.includes("sku")) {
    return { sku: "Bu ürün kodu başka bir üründe kullanılıyor. Farklı bir kod girin." };
  }
  return {};
}

function readProductForm(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") ?? "",
    brandId: formData.get("brandId") ?? "",
    categoryId: formData.get("categoryId") ?? "",
    sku: formData.get("sku") ?? "",
    shortDescription: formData.get("shortDescription") ?? "",
    longDescription: formData.get("longDescription") ?? "",
    priceMinor: formData.get("price"),
    compareAtPriceMinor: formData.get("compareAtPrice"),
    availability: formData.get("availability"),
    isOriginal: formData.get("isOriginal") ?? "unknown",
    boxContents: formData.get("boxContents") ?? "",
    installationNotes: formData.get("installationNotes") ?? "",
    isFeatured: formData.get("isFeatured") === "on",
    displayOrder: formData.get("displayOrder") || "0",
    status: formData.get("status"),
    seoTitle: formData.get("seoTitle") ?? "",
    seoDescription: formData.get("seoDescription") ?? "",
  });
}

/**
 * Alt koleksiyonları okur.
 *
 * Ayrıştırılamayan bir koleksiyon `null` döner ve BURADA yakalanır. Eskiden
 * boş diziye düşüyordu; bu, kullanıcının tüm satırlarını sessizce silmek
 * demekti — hata bile görünmüyordu.
 */
function readSubResources(
  formData: FormData,
):
  | { ok: true; data: z.infer<typeof productSubResourcesSchema> }
  | { ok: false; fieldErrors: Record<string, string> } {
  const collections = {
    specs: parseCollectionField(formData, "specs"),
    compatibleModelIds: parseCollectionField(formData, "compatibleModelIds"),
    marketplaceLinks: parseCollectionField(formData, "marketplaceLinks"),
    relatedProductIds: parseCollectionField(formData, "relatedProductIds"),
  };

  const unreadable = Object.entries(collections).filter(([, value]) => value === null);
  if (unreadable.length > 0) {
    return {
      ok: false,
      fieldErrors: Object.fromEntries(
        unreadable.map(([key]) => [
          key,
          "Bu bölümün içeriği okunamadı. Sayfayı yenileyip yeniden deneyin.",
        ]),
      ),
    };
  }

  const parsed = productSubResourcesSchema.safeParse(collections);
  if (!parsed.success)
    return { ok: false, fieldErrors: fieldErrorsFromZodIssues(parsed.error.issues) };
  return { ok: true, data: parsed.data };
}

/** Alt tabloları "sil ve yeniden yaz" ile eşitler. */
async function syncSubResources(
  productId: string,
  sub: z.infer<typeof productSubResourcesSchema>,
): Promise<string | null> {
  const supabase = await getServerClient();

  /*
    STRATEJİ: alt kayıtlar tümüyle silinip yeniden yazılır.

    Gerekçe: bu tablolar küçüktür (ürün başına onlarca satır) ve fark hesaplamak
    (hangi satır eklendi/çıkarıldı/sıralandı) hataya çok açıktır. Silme+yazma
    her zaman formdaki durumu birebir yansıtır.

    ÖDÜNLEŞİM: `product_specs.id` değerleri her kayıtta değişir. Bu kimlikler
    dışarıya verilmediği için sorun değildir. Görseller BU KAPSAMDA DEĞİLDİR —
    onların kimliği Storage yoluna bağlıdır ve ayrı yönetilir.
  */
  const { error: specDeleteError } = await supabase
    .from("product_specs")
    .delete()
    .eq("product_id", productId);
  if (specDeleteError) return messageFromPostgresError(specDeleteError);

  if (sub.specs.length > 0) {
    const { error } = await supabase.from("product_specs").insert(
      sub.specs.map((spec, index) => ({
        product_id: productId,
        label: spec.label,
        value: spec.value,
        display_order: (index + 1) * 10,
      })),
    );
    if (error) return messageFromPostgresError(error);
  }

  const { error: compatDeleteError } = await supabase
    .from("product_compatibility")
    .delete()
    .eq("product_id", productId);
  if (compatDeleteError) return messageFromPostgresError(compatDeleteError);

  if (sub.compatibleModelIds.length > 0) {
    const { error } = await supabase.from("product_compatibility").insert(
      // Tekrarları ele: aynı model iki kez seçilmiş olabilir.
      [...new Set(sub.compatibleModelIds)].map((modelId) => ({
        product_id: productId,
        device_model_id: modelId,
        // Uyumluluk DOĞRULANMIŞ bir iddiadır (§20); panel bunu ayrıca girmez.
        verified_note: null,
      })),
    );
    if (error) return messageFromPostgresError(error);
  }

  const { error: linkDeleteError } = await supabase
    .from("product_marketplace_links")
    .delete()
    .eq("product_id", productId);
  if (linkDeleteError) return messageFromPostgresError(linkDeleteError);

  if (sub.marketplaceLinks.length > 0) {
    const { error } = await supabase.from("product_marketplace_links").insert(
      sub.marketplaceLinks.map((link, index) => ({
        product_id: productId,
        marketplace: link.marketplace,
        custom_label: link.customLabel,
        url: link.url,
        link_target: link.linkTarget,
        is_active: link.isActive,
        display_order: (index + 1) * 10,
      })),
    );
    if (error) return messageFromPostgresError(error);
  }

  const { error: relatedDeleteError } = await supabase
    .from("related_products")
    .delete()
    .eq("product_id", productId);
  if (relatedDeleteError) return messageFromPostgresError(relatedDeleteError);

  const relatedIds = [...new Set(sub.relatedProductIds)].filter((id) => id !== productId);
  if (relatedIds.length > 0) {
    const { error } = await supabase.from("related_products").insert(
      relatedIds.map((relatedId, index) => ({
        product_id: productId,
        related_product_id: relatedId,
        display_order: (index + 1) * 10,
      })),
    );
    if (error) return messageFromPostgresError(error);
  }

  return null;
}

export async function saveProductAction(
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  /*
    GÖNDERİLEN DEĞERLER İLK İŞTE OKUNUR ve her hatalı çıkışta geri gönderilir.

    Sebebi: React `<form action={fn}>` gönderiminden sonra formu otomatik
    sıfırlar. Doğrulama hatasında kullanıcının doldurduğu her alan silinirdi ve
    uzun bir ürün formunu yeniden doldurmak, panelin en pahalı hatasıydı.
    Doğrulama kuralları buna karşılık HİÇ gevşetilmedi — yalnız hata sonrası
    kullanıcıya verdiğimiz şey değişti.
  */
  const submitted = productFormValuesFromFormData(formData);
  const fail = (message: string, fieldErrors: Record<string, string> = {}) =>
    actionError(message, fieldErrors, submitted);

  const guard = await requireAdminAction();
  if (!guard.ok) return fail(guard.message);

  /*
    TEMEL ALANLAR VE ALT BÖLÜMLER TEK GEÇİŞTE doğrulanır. İlk hatada durulsaydı
    kullanıcı önce üstteki alanı düzeltip gönderir, sonra alt bölümdeki hatayı
    görürdü — aynı formu iki kez göndermek gerekirdi. Kurallar aynı; yalnız
    hepsi aynı anda söyleniyor.
  */
  const parsed = readProductForm(formData);
  const sub = readSubResources(formData);

  if (!parsed.success || !sub.ok) {
    const fieldErrors = {
      ...(parsed.success ? {} : fieldErrorsFromZodIssues(parsed.error.issues)),
      ...(sub.ok ? {} : sub.fieldErrors),
    };
    const scope =
      !parsed.success && !sub.ok
        ? "Formda ve alt bölümlerde"
        : parsed.success
          ? "Alt bölümlerde (özellik, uyumluluk, pazaryeri)"
          : "Formda";
    return fail(
      `${scope} düzeltilmesi gereken alanlar var. Hatalı alanlar aşağıda işaretlendi.`,
      fieldErrors,
    );
  }

  const input = parsed.data;
  const slug = await resolveSlug(input.slug, input.name);
  if (!slug) {
    return fail("Slug üretilemedi.", {
      slug: "Ürün adından slug üretilemedi; slug alanını elle doldurun.",
    });
  }

  const supabase = await getServerClient();
  const productId = formData.get("id");
  const isUpdate = typeof productId === "string" && productId !== "";

  const row = {
    name: input.name,
    slug,
    brand_id: input.brandId,
    category_id: input.categoryId,
    sku: input.sku,
    short_description: input.shortDescription,
    long_description: input.longDescription,
    price_minor: input.priceMinor,
    compare_at_price_minor: input.compareAtPriceMinor,
    availability: input.availability,
    is_original: input.isOriginal,
    box_contents: input.boxContents,
    installation_notes: input.installationNotes,
    is_featured: input.isFeatured,
    display_order: input.displayOrder,
    status: input.status,
    seo_title: input.seoTitle,
    seo_description: input.seoDescription,
  };

  let savedId: string;

  if (isUpdate) {
    const { data, error } = await supabase
      .from("products")
      .update(row)
      .eq("id", productId)
      .select("id")
      .maybeSingle();

    if (error) return fail(messageFromPostgresError(error), uniqueFieldErrors(error));
    if (!data) {
      // RLS satırı gizlemiş olabilir; yetki yokmuş gibi davranmak doğrudur.
      return fail("Ürün bulunamadı veya güncelleme yetkiniz yok.");
    }
    savedId = data.id;
  } else {
    const { data, error } = await supabase.from("products").insert(row).select("id").maybeSingle();

    if (error) return fail(messageFromPostgresError(error), uniqueFieldErrors(error));
    if (!data) return fail("Ürün oluşturulamadı.");
    savedId = data.id;
  }

  const subError = await syncSubResources(savedId, sub.data);
  if (subError) return fail(subError);

  revalidatePath("/admin/urunler");
  revalidatePath(`/admin/urunler/${savedId}`);
  revalidatePath("/admin/secki");
  revalidatePath("/veri-kontrol");
  /*
    GENEL YÜZEYLER de tazelenir. Burada eskiden yalnız "/" vardı ve gerekçesi
    "Seçki kutucuğu ana sayfayı değiştirir" diye yazılmıştı — doğruydu ama
    eksikti: aynı kayıt katalog listesini ve ürünün kendi detay sayfasını da
    değiştirir. Liste `lib/admin/revalidate.ts` içinde, tek yerde.
  */
  revalidateProductSurfaces(slug);

  if (!isUpdate) {
    // Yeni ürün: düzenleme sayfasına geç ki görsel eklenebilsin.
    redirect(`/admin/urunler/${savedId}?kaydedildi=1`);
  }

  /*
    Başarıda da değer geri gönderilir. Tek sebebi otomatik üretilen slug:
    kullanıcı alanı boş bırakmışsa kaydedilen adresi görmesi gerekir, yoksa
    formda hâlâ boş görünür ve bir sonraki kayıtta ne olacağını bilemez.
  */
  return actionSuccess("Ürün kaydedildi.", { ...submitted, id: savedId, slug });
}

/**
 * Ürünü KOPYALAYARAK ÇOĞALTIR (CLAUDE.md: toplu CSV içe aktarma yok, bunun
 * yerine "ürün formu + kopyalayarak çoğaltma").
 *
 * Kopya DAİMA `draft` doğar: benzer bir ürünü çoğaltıp düzenlemeyi unutmak,
 * yanlış bilgiyi yayına almanın en kolay yoludur.
 *
 * KOPYALANMAYANLAR ve sebepleri:
 *   - `sku`      → benzersizdir; kopyada boş bırakılır, yönetici kendi girer.
 *   - görseller  → satırları kopyalasaydık iki ürün AYNI Storage dosyasını
 *                  gösterirdi ve birini silmek diğerini kırardı. Dosyayı
 *                  gerçekten çoğaltmak sessiz bir depolama maliyetidir;
 *                  kullanıcıya açıkça söylenir.
 *   - `is_demo`  → kopya elle üretilmiş gerçek bir kayıttır, örnek veri değil.
 */
export async function duplicateProductAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireAdminAction();
  if (!guard.ok) return actionError(guard.message);

  const sourceId = formData.get("id");
  if (typeof sourceId !== "string" || sourceId === "") return actionError("Ürün seçilmedi.");

  const supabase = await getServerClient();

  const { data: source, error: readError } = await supabase
    .from("products")
    .select(
      `
      *,
      specs:product_specs ( label, value, display_order ),
      compatibility:product_compatibility ( device_model_id ),
      links:product_marketplace_links ( marketplace, custom_label, url, link_target, is_active, display_order ),
      related:related_products!related_products_product_id_fkey ( related_product_id, display_order )
    `,
    )
    .eq("id", sourceId)
    .maybeSingle();

  if (readError) return actionError(messageFromPostgresError(readError));
  if (!source) return actionError("Ürün bulunamadı veya yetkiniz yok.");

  const copyName = `${source.name} (kopya)`;
  const slug = await generateUniqueSlug(copyName);
  if (!slug) {
    return actionError("Kopya için slug üretilemedi. Ürünü elle oluşturmayı deneyin.");
  }

  const { data: created, error: insertError } = await supabase
    .from("products")
    .insert({
      name: copyName,
      slug,
      brand_id: source.brand_id,
      category_id: source.category_id,
      sku: null,
      short_description: source.short_description,
      long_description: source.long_description,
      price_minor: source.price_minor,
      compare_at_price_minor: source.compare_at_price_minor,
      availability: source.availability,
      is_original: source.is_original,
      box_contents: source.box_contents,
      installation_notes: source.installation_notes,
      is_featured: false,
      display_order: source.display_order,
      status: "draft",
      seo_title: source.seo_title,
      seo_description: source.seo_description,
    })
    .select("id")
    .maybeSingle();

  if (insertError) return actionError(messageFromPostgresError(insertError));
  if (!created) return actionError("Kopya oluşturulamadı.");

  const subError = await syncSubResources(created.id, {
    specs: (source.specs ?? []).map((spec) => ({ label: spec.label, value: spec.value })),
    compatibleModelIds: (source.compatibility ?? []).map((row) => row.device_model_id),
    marketplaceLinks: (source.links ?? []).map((link) => ({
      marketplace: link.marketplace,
      customLabel: link.custom_label,
      url: link.url,
      linkTarget: link.link_target,
      isActive: link.is_active,
    })),
    relatedProductIds: (source.related ?? []).map((row) => row.related_product_id),
  });
  if (subError) return actionError(subError);

  /*
    GENEL YÜZEY TAZELENMEZ VE BU DOĞRUDUR. Kopya `status: "draft"` ve
    `is_featured: false` ile oluşturulur (yukarıya bakınız), yani anonim
    istemciye RLS zaten göstermez. Tazelemek boşa iş olurdu.

    Not düşülmesinin sebebi: bir kod incelemesi burayı "eksik tazeleme" diye
    işaretledi. Eksik değil; kopyanın taslak doğması bilinçli bir karar.
    Kopya yayına alındığında tazeleme `setProductStatusAction` içinde olur.
  */
  revalidatePath("/admin/urunler");
  redirect(`/admin/urunler/${created.id}?kopyalandi=1`);
}

/**
 * Ada karşılık çakışmayan bir slug üretir: `ad`, `ad-2`, `ad-3`…
 *
 * Kopyalama akışında gereklidir çünkü "(kopya)" eki aynı üründen iki kez
 * çoğaltıldığında AYNI slug'ı üretir ve kullanıcı hiçbir form doldurmadığı
 * için düzeltebileceği bir alan yoktur. Normal kaydetmede bu yapılmaz —
 * orada çakışma kullanıcıya bildirilir ve slug'ı kendisi seçer.
 */
async function generateUniqueSlug(name: string): Promise<string | null> {
  const base = await resolveSlug(null, name);
  if (!base) return null;

  const supabase = await getServerClient();

  for (let suffix = 1; suffix <= 50; suffix += 1) {
    const candidate = suffix === 1 ? base : `${base}-${suffix}`;
    const { data, error } = await supabase
      .from("products")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) return null;
    if (!data) return candidate;
  }

  return null;
}

/** Durum değiştirme (arşivle / yayımla / taslağa al). Kalıcı silme YOKTUR. */
export async function setProductStatusAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireAdminAction();
  if (!guard.ok) return actionError(guard.message);

  const id = formData.get("id");
  const status = publicationStatusSchema.safeParse(formData.get("status"));

  if (typeof id !== "string" || id === "") return actionError("Ürün seçilmedi.");
  if (!status.success) return actionError("Geçersiz yayın durumu.");

  const supabase = await getServerClient();
  /*
    `slug` DE SEÇİLİR: ürünün kendi detay sayfasını tazelemek için gerekir.
    Yalnız `id` seçiliyordu ve bu yüzden arşivlenen bir ürünün detay sayfası
    beş dakikaya kadar yayında kalabiliyordu.
  */
  const { data, error } = await supabase
    .from("products")
    .update({ status: status.data })
    .eq("id", id)
    .select("id, slug")
    .maybeSingle();

  if (error) return actionError(messageFromPostgresError(error));
  if (!data) return actionError("Ürün bulunamadı veya yetkiniz yok.");

  revalidatePath("/admin/urunler");
  revalidatePath(`/admin/urunler/${id}`);
  revalidatePath("/veri-kontrol");
  /*
    DURUM DEĞİŞİKLİĞİ EN KRİTİK TAZELEME NOKTASIDIR: arşivlenen ya da yayından
    kaldırılan bir ürün, tazeleme olmadan sitede satılmaya devam eder.
  */
  revalidateProductSurfaces(data.slug);

  const labels: Record<string, string> = {
    draft: "taslağa alındı",
    active: "yayımlandı",
    passive: "yayından kaldırıldı",
    archived: "arşivlendi",
  };
  return actionSuccess(`Ürün ${labels[status.data]}.`);
}
