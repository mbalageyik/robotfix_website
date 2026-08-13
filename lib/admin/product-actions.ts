"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminAction } from "@/lib/auth/dal";
import { getServerClient } from "@/lib/supabase/server-client";
import { resolveSlug } from "@/lib/admin/slug";
import { productSchema, productSubResourcesSchema, publicationStatusSchema } from "@/lib/admin/schemas";
import {
  actionError,
  actionSuccess,
  fieldErrorsFromZod,
  messageFromPostgresError,
  type ActionState,
} from "@/lib/admin/action-result";

/*
  ÜRÜN YAZMA AKSİYONLARI.

  HER aksiyon `requireAdminAction()` ile BAŞLAR. Formun yalnız yetkili bir
  sayfada render edilmiş olması güvenlik sınırı değildir: aksiyon uç noktasına
  arayüzden geçmeden istek gönderilebilir.

  CSRF: Next.js `Origin`/`Host` karşılaştırmasını kendi yapar (bkz.
  lib/auth/actions.ts başlığı). Ek mekanizma yazılmadı.

  Doğrulama sırası: yetki → şema → veritabanı. Üçü de bağımsız hattır.
*/

/** Formdaki JSON alanlarını güvenle ayrıştırır. */
function parseJsonField(formData: FormData, key: string): unknown {
  const raw = formData.get(key);
  if (typeof raw !== "string" || raw.trim() === "") return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return null; // şema doğrulaması anlamlı hatayı üretecek
  }
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

function readSubResources(formData: FormData) {
  return productSubResourcesSchema.safeParse({
    specs: parseJsonField(formData, "specs") ?? [],
    compatibleModelIds: parseJsonField(formData, "compatibleModelIds") ?? [],
    marketplaceLinks: parseJsonField(formData, "marketplaceLinks") ?? [],
    relatedProductIds: parseJsonField(formData, "relatedProductIds") ?? [],
  });
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
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireAdminAction();
  if (!guard.ok) return actionError(guard.message);

  const parsed = readProductForm(formData);
  if (!parsed.success) {
    return actionError(
      "Formda düzeltilmesi gereken alanlar var.",
      fieldErrorsFromZod(z.flattenError(parsed.error)),
    );
  }

  const sub = readSubResources(formData);
  if (!sub.success) {
    return actionError(
      "Alt bölümlerde (özellik, uyumluluk, pazaryeri) düzeltilmesi gereken kayıtlar var.",
      fieldErrorsFromZod(z.flattenError(sub.error)),
    );
  }

  const input = parsed.data;
  const slug = await resolveSlug(input.slug, input.name);
  if (!slug) {
    return actionError("Slug üretilemedi.", {
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

    if (error) {
      return actionError(messageFromPostgresError(error), {
        ...(error.code === "23505" && error.message.includes("slug")
          ? { slug: "Bu slug zaten kullanılıyor." }
          : {}),
        ...(error.code === "23505" && error.message.includes("sku")
          ? { sku: "Bu ürün kodu başka bir üründe kullanılıyor." }
          : {}),
      });
    }
    if (!data) {
      // RLS satırı gizlemiş olabilir; yetki yokmuş gibi davranmak doğrudur.
      return actionError("Ürün bulunamadı veya güncelleme yetkiniz yok.");
    }
    savedId = data.id;
  } else {
    const { data, error } = await supabase
      .from("products")
      .insert(row)
      .select("id")
      .maybeSingle();

    if (error) {
      return actionError(messageFromPostgresError(error), {
        ...(error.code === "23505" && error.message.includes("slug")
          ? { slug: "Bu slug zaten kullanılıyor." }
          : {}),
        ...(error.code === "23505" && error.message.includes("sku")
          ? { sku: "Bu ürün kodu başka bir üründe kullanılıyor." }
          : {}),
      });
    }
    if (!data) return actionError("Ürün oluşturulamadı.");
    savedId = data.id;
  }

  const subError = await syncSubResources(savedId, sub.data);
  if (subError) return actionError(subError);

  revalidatePath("/admin/urunler");
  revalidatePath(`/admin/urunler/${savedId}`);
  revalidatePath("/veri-kontrol");

  if (!isUpdate) {
    // Yeni ürün: düzenleme sayfasına geç ki görsel eklenebilsin.
    redirect(`/admin/urunler/${savedId}?kaydedildi=1`);
  }

  return actionSuccess("Ürün kaydedildi.");
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
  const { data, error } = await supabase
    .from("products")
    .update({ status: status.data })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) return actionError(messageFromPostgresError(error));
  if (!data) return actionError("Ürün bulunamadı veya yetkiniz yok.");

  revalidatePath("/admin/urunler");
  revalidatePath(`/admin/urunler/${id}`);
  revalidatePath("/veri-kontrol");

  const labels: Record<string, string> = {
    draft: "taslağa alındı",
    active: "yayımlandı",
    passive: "yayından kaldırıldı",
    archived: "arşivlendi",
  };
  return actionSuccess(`Ürün ${labels[status.data]}.`);
}
