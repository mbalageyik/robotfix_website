"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminAction } from "@/lib/auth/dal";
import { getServerClient } from "@/lib/supabase/server-client";
import { resolveSlug } from "@/lib/admin/slug";
import {
  brandSchema,
  categorySchema,
  deviceModelSchema,
  publicationStatusSchema,
  serviceSchema,
} from "@/lib/admin/schemas";
import {
  actionError,
  actionSuccess,
  fieldErrorsFromZod,
  messageFromPostgresError,
  type ActionState,
} from "@/lib/admin/action-result";

/*
  Marka / Kategori / Cihaz modeli / Hizmet aksiyonları.

  Her biri `requireAdminAction()` ile başlar. Ortak desen `saveRecord` içinde
  toplandı; farklar (şema, tablo, slug kaynağı) parametre olarak verilir.
*/

type TableName = "brands" | "categories" | "device_models" | "services";

const REVALIDATE_PATHS: Record<TableName, string> = {
  brands: "/admin/markalar",
  categories: "/admin/kategoriler",
  device_models: "/admin/cihaz-modelleri",
  services: "/admin/hizmetler",
};

async function finish(table: TableName, message: string): Promise<ActionState> {
  revalidatePath(REVALIDATE_PATHS[table]);
  revalidatePath("/veri-kontrol");
  return actionSuccess(message);
}

// --- Marka ----------------------------------------------------------------

export async function saveBrandAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireAdminAction();
  if (!guard.ok) return actionError(guard.message);

  const parsed = brandSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") ?? "",
    description: formData.get("description") ?? "",
    displayOrder: formData.get("displayOrder") || "0",
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return actionError(
      "Formda düzeltilmesi gereken alanlar var.",
      fieldErrorsFromZod(z.flattenError(parsed.error)),
    );
  }

  const slug = await resolveSlug(parsed.data.slug, parsed.data.name);
  if (!slug) return actionError("Slug üretilemedi.", { slug: "Slug alanını elle doldurun." });

  const supabase = await getServerClient();
  const id = formData.get("id");
  const row = {
    name: parsed.data.name,
    slug,
    description: parsed.data.description,
    display_order: parsed.data.displayOrder,
    status: parsed.data.status,
  };

  const query =
    typeof id === "string" && id !== ""
      ? supabase.from("brands").update(row).eq("id", id)
      : supabase.from("brands").insert(row);

  const { error } = await query;
  if (error) {
    return actionError(messageFromPostgresError(error), {
      ...(error.code === "23505" ? { slug: "Bu slug zaten kullanılıyor." } : {}),
    });
  }

  return finish("brands", "Marka kaydedildi.");
}

// --- Kategori -------------------------------------------------------------

/** `wouldCreateCycle` sonucu — okuma hatası ile "döngü var" ayrı durumlardır. */
type CycleCheck = { ok: true; cyclic: boolean } | { ok: false; message: string };

/**
 * DÖNGÜSEL REFERANS ENGELİ.
 *
 * Şemada yalnız `parent_id <> id` kısıtı var (kendi kendinin üstü olamaz).
 * Daha derin döngüler (A→B→A) burada engellenir.
 *
 * Kontrol: adayın ATA zincirini yukarı yürü; düzenlenen kategoriye rastlarsak
 * döngü oluşur. Veride hâlihazırda bir döngü varsa `seen` kümesi sonsuz
 * dönmeyi keser.
 *
 * AYRI FONKSİYON olmasının sebebi yalnız düzen değil: gövde `saveCategoryAction`
 * içindeyken `cursor` kendi başlatıcısına dolaylı olarak geri döndüğü için
 * TypeScript satır içi sorgu sonucunu `any` çıkarsıyordu (TS7022). Dönüş tipi
 * burada açıkça yazıldığından o döngü kırılır.
 */
async function wouldCreateCycle(categoryId: string, parentId: string): Promise<CycleCheck> {
  const supabase = await getServerClient();
  const seen = new Set<string>();
  let cursor = parentId;

  for (;;) {
    if (cursor === categoryId) return { ok: true, cyclic: true };
    if (seen.has(cursor)) return { ok: true, cyclic: false };
    seen.add(cursor);

    const { data, error } = await supabase
      .from("categories")
      .select("parent_id")
      .eq("id", cursor)
      .maybeSingle();

    if (error) return { ok: false, message: messageFromPostgresError(error) };

    const next = data?.parent_id ?? null;
    if (next === null) return { ok: true, cyclic: false };
    cursor = next;
  }
}

export async function saveCategoryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireAdminAction();
  if (!guard.ok) return actionError(guard.message);

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") ?? "",
    description: formData.get("description") ?? "",
    parentId: formData.get("parentId") ?? "",
    displayOrder: formData.get("displayOrder") || "0",
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return actionError(
      "Formda düzeltilmesi gereken alanlar var.",
      fieldErrorsFromZod(z.flattenError(parsed.error)),
    );
  }

  const id = formData.get("id");
  const isUpdate = typeof id === "string" && id !== "";

  /*
    DÖNGÜSEL REFERANS ENGELİ.

    Şemada yalnız `parent_id <> id` kısıtı var (kendi kendinin üstü olamaz).
    Daha derin döngüler (A→B→A) uygulama katmanında engellenir; kısıt yorumu
    bunu açıkça söylüyor.

    Kontrol: adayın ATA zincirini yukarı yürü; düzenlenen kategoriye rastlarsak
    döngü oluşur. Zincir uzunluğu sınırlıdır (güvenlik için üst sınır konur).
  */
  if (isUpdate && parsed.data.parentId) {
    if (parsed.data.parentId === id) {
      return actionError("Bir kategori kendi üst kategorisi olamaz.", {
        parentId: "Bir kategori kendi üst kategorisi olamaz.",
      });
    }

    const cycle = await wouldCreateCycle(id, parsed.data.parentId);
    if (!cycle.ok) return actionError(cycle.message);
    if (cycle.cyclic) {
      return actionError("Bu seçim döngüsel bir kategori zinciri oluşturur.", {
        parentId:
          "Bu kategori, seçtiğiniz kategorinin üst zincirinde yer alıyor; döngü oluşur.",
      });
    }
  }

  const slug = await resolveSlug(parsed.data.slug, parsed.data.name);
  if (!slug) return actionError("Slug üretilemedi.", { slug: "Slug alanını elle doldurun." });

  const supabase = await getServerClient();
  const row = {
    name: parsed.data.name,
    slug,
    description: parsed.data.description,
    parent_id: parsed.data.parentId,
    display_order: parsed.data.displayOrder,
    status: parsed.data.status,
  };

  const { error } = isUpdate
    ? await supabase.from("categories").update(row).eq("id", id)
    : await supabase.from("categories").insert(row);

  if (error) {
    return actionError(messageFromPostgresError(error), {
      ...(error.code === "23505" ? { slug: "Bu slug zaten kullanılıyor." } : {}),
    });
  }

  return finish("categories", "Kategori kaydedildi.");
}

// --- Cihaz modeli ---------------------------------------------------------

export async function saveDeviceModelAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireAdminAction();
  if (!guard.ok) return actionError(guard.message);

  const parsed = deviceModelSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") ?? "",
    brandId: formData.get("brandId"),
    notes: formData.get("notes") ?? "",
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return actionError(
      "Formda düzeltilmesi gereken alanlar var.",
      fieldErrorsFromZod(z.flattenError(parsed.error)),
    );
  }

  const slug = await resolveSlug(parsed.data.slug, parsed.data.name);
  if (!slug) return actionError("Slug üretilemedi.", { slug: "Slug alanını elle doldurun." });

  const supabase = await getServerClient();
  const id = formData.get("id");
  const row = {
    name: parsed.data.name,
    slug,
    brand_id: parsed.data.brandId,
    notes: parsed.data.notes,
    status: parsed.data.status,
  };

  const { error } =
    typeof id === "string" && id !== ""
      ? await supabase.from("device_models").update(row).eq("id", id)
      : await supabase.from("device_models").insert(row);

  if (error) {
    return actionError(messageFromPostgresError(error), {
      // Slug MARKA İÇİNDE benzersizdir; mesaj bunu söylemeli.
      ...(error.code === "23505"
        ? { slug: "Bu markada aynı slug'a sahip başka bir model var." }
        : {}),
    });
  }

  return finish("device_models", "Cihaz modeli kaydedildi.");
}

// --- Hizmet ---------------------------------------------------------------

export async function saveServiceAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireAdminAction();
  if (!guard.ok) return actionError(guard.message);

  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") ?? "",
    shortDescription: formData.get("shortDescription") ?? "",
    longDescription: formData.get("longDescription") ?? "",
    iconKey: formData.get("iconKey") ?? "",
    displayOrder: formData.get("displayOrder") || "0",
    status: formData.get("status"),
    seoTitle: formData.get("seoTitle") ?? "",
    seoDescription: formData.get("seoDescription") ?? "",
  });

  if (!parsed.success) {
    return actionError(
      "Formda düzeltilmesi gereken alanlar var.",
      fieldErrorsFromZod(z.flattenError(parsed.error)),
    );
  }

  const slug = await resolveSlug(parsed.data.slug, parsed.data.name);
  if (!slug) return actionError("Slug üretilemedi.", { slug: "Slug alanını elle doldurun." });

  const supabase = await getServerClient();
  const id = formData.get("id");
  const row = {
    name: parsed.data.name,
    slug,
    short_description: parsed.data.shortDescription,
    long_description: parsed.data.longDescription,
    icon_key: parsed.data.iconKey,
    display_order: parsed.data.displayOrder,
    status: parsed.data.status,
    seo_title: parsed.data.seoTitle,
    seo_description: parsed.data.seoDescription,
  };

  const { error } =
    typeof id === "string" && id !== ""
      ? await supabase.from("services").update(row).eq("id", id)
      : await supabase.from("services").insert(row);

  if (error) {
    return actionError(messageFromPostgresError(error), {
      ...(error.code === "23505" ? { slug: "Bu slug zaten kullanılıyor." } : {}),
    });
  }

  return finish("services", "Hizmet kaydedildi.");
}

// --- Durum değiştirme (arşivleme) -----------------------------------------

const STATUS_LABELS: Record<string, string> = {
  draft: "taslağa alındı",
  active: "yayımlandı",
  passive: "yayından kaldırıldı",
  archived: "arşivlendi",
};

/**
 * Taksonomi kaydının durumunu değiştirir.
 *
 * KALICI SİLME YOKTUR (bilgi dosyası §17): arşivleme esastır. Bu, "sessizce
 * yetim kayıt bırakma" gereksinimini de karşılar — bağlı ürünler kırılmaz,
 * yalnız arşivlenen kayıt yayından düşer.
 *
 * Yine de kullanıcı arşivlemeden ÖNCE kaça bağlı olduğunu görmelidir; sayım
 * aşağıda hesaplanır ve mesaja yazılır.
 */
export async function setTaxonomyStatusAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireAdminAction();
  if (!guard.ok) return actionError(guard.message);

  const table = formData.get("table");
  const id = formData.get("id");
  const status = publicationStatusSchema.safeParse(formData.get("status"));

  const allowed: TableName[] = ["brands", "categories", "device_models", "services"];
  if (typeof table !== "string" || !allowed.includes(table as TableName)) {
    return actionError("Geçersiz kayıt türü.");
  }
  if (typeof id !== "string" || id === "") return actionError("Kayıt seçilmedi.");
  if (!status.success) return actionError("Geçersiz yayın durumu.");

  const tableName = table as TableName;
  const supabase = await getServerClient();

  // Arşivlerken bağlı kayıt sayısını bildir — sessizce yetim bırakma.
  let dependencyNote = "";
  if (status.data === "archived") {
    const counts = await countDependents(tableName, id);
    if (counts > 0) {
      dependencyNote = ` Bu kayda bağlı ${counts} kayıt var; onlar silinmedi, yalnız bu kayıt arşivlendi.`;
    }
  }

  const { data, error } = await supabase
    .from(tableName)
    .update({ status: status.data })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) return actionError(messageFromPostgresError(error));
  if (!data) return actionError("Kayıt bulunamadı veya yetkiniz yok.");

  revalidatePath(REVALIDATE_PATHS[tableName]);
  revalidatePath("/veri-kontrol");
  return actionSuccess(`Kayıt ${STATUS_LABELS[status.data]}.${dependencyNote}`);
}

/** Bu kayda bağlı ürün/model sayısı. */
async function countDependents(table: TableName, id: string): Promise<number> {
  const supabase = await getServerClient();

  switch (table) {
    case "brands": {
      const [products, models] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }).eq("brand_id", id),
        supabase
          .from("device_models")
          .select("id", { count: "exact", head: true })
          .eq("brand_id", id),
      ]);
      return (products.count ?? 0) + (models.count ?? 0);
    }
    case "categories": {
      const [products, children] = await Promise.all([
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("category_id", id),
        supabase
          .from("categories")
          .select("id", { count: "exact", head: true })
          .eq("parent_id", id),
      ]);
      return (products.count ?? 0) + (children.count ?? 0);
    }
    case "device_models": {
      const { count } = await supabase
        .from("product_compatibility")
        .select("product_id", { count: "exact", head: true })
        .eq("device_model_id", id);
      return count ?? 0;
    }
    case "services":
      return 0;
  }
}
