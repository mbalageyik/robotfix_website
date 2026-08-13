"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/auth/dal";
import { getServerClient } from "@/lib/supabase/server-client";
import { imageMetaSchema, validateImageFile } from "@/lib/admin/schemas";
import { PRODUCT_IMAGE_BUCKET, buildImagePath } from "@/lib/admin/storage";
import {
  actionError,
  actionSuccess,
  messageFromPostgresError,
  type ActionState,
} from "@/lib/admin/action-result";

/*
  GÖRSEL AKSİYONLARI.

  Yükleme kullanıcının KENDİ oturumuyla yapılır — service role ile DEĞİL.
  Storage politikaları (migrasyon 04) `public.is_admin()` kontrol eder, yani
  RLS burada da ikinci savunma hattı olarak yerinde kalır.

  Dosya kısıtı iki katmanda uygulanır:
    1. `validateImageFile` — anlaşılır Türkçe mesaj (bu dosya).
    2. Kova düzeyi `allowed_mime_types` + `file_size_limit` — Storage API'si
       kendi uygular; uygulama atlansa bile reddeder.
*/

export async function uploadProductImageAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireAdminAction();
  if (!guard.ok) return actionError(guard.message);

  const productId = formData.get("productId");
  if (typeof productId !== "string" || productId === "") {
    return actionError("Ürün belirtilmedi.");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return actionError("Dosya seçilmedi.", { file: "Bir görsel dosyası seçin." });
  }

  const validation = validateImageFile(file);
  if (!validation.ok) {
    return actionError(validation.message, { file: validation.message });
  }

  const meta = imageMetaSchema.safeParse({ altText: formData.get("altText") ?? "" });
  if (!meta.success) {
    return actionError("Alternatif metin geçersiz.", {
      altText: "Alternatif metin en fazla 300 karakter olabilir.",
    });
  }

  const supabase = await getServerClient();

  // Ürün gerçekten var mı ve görebiliyor muyuz (RLS) — yoksa yetim dosya kalırdı.
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();

  if (productError) return actionError(messageFromPostgresError(productError));
  if (!product) return actionError("Ürün bulunamadı veya yetkiniz yok.");

  const storagePath = buildImagePath(productId, file.type);

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      // Yol benzersiz üretildiği için üzerine yazma beklenmez; kapalı tutulur.
      upsert: false,
    });

  if (uploadError) {
    return actionError(`Görsel yüklenemedi: ${uploadError.message}`, {
      file: "Görsel yüklenemedi.",
    });
  }

  // Kaçıncı görsel olduğunu bul (sıra için) ve ilk görselse ana görsel yap.
  const { data: existing, error: existingError } = await supabase
    .from("product_images")
    .select("id, display_order")
    .eq("product_id", productId)
    .order("display_order", { ascending: false })
    .limit(1);

  if (existingError) {
    // Veritabanı satırı yazılamayacaksa yüklenen dosyayı geri al —
    // aksi hâlde kovada kimsenin bilmediği yetim bir dosya kalır.
    await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([storagePath]);
    return actionError(messageFromPostgresError(existingError));
  }

  const isFirst = (existing?.length ?? 0) === 0;
  const nextOrder = isFirst ? 10 : (existing![0].display_order ?? 0) + 10;

  const { error: insertError } = await supabase.from("product_images").insert({
    product_id: productId,
    storage_path: storagePath,
    alt_text: meta.data.altText,
    display_order: nextOrder,
    is_primary: isFirst,
  });

  if (insertError) {
    await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([storagePath]);
    return actionError(messageFromPostgresError(insertError));
  }

  revalidatePath(`/admin/urunler/${productId}`);
  return actionSuccess("Görsel yüklendi.");
}

export async function setPrimaryImageAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireAdminAction();
  if (!guard.ok) return actionError(guard.message);

  const imageId = formData.get("imageId");
  const productId = formData.get("productId");
  if (typeof imageId !== "string" || typeof productId !== "string") {
    return actionError("Görsel seçilmedi.");
  }

  const supabase = await getServerClient();

  /*
    `product_images_one_primary_idx` ürün başına tek ana görsele izin verir.
    Bu yüzden ÖNCE hepsi sıfırlanır, SONRA seçilen işaretlenir. Ters sırada
    yapılsaydı benzersizlik ihlali alırdık.
  */
  const { error: clearError } = await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId);
  if (clearError) return actionError(messageFromPostgresError(clearError));

  const { data, error } = await supabase
    .from("product_images")
    .update({ is_primary: true })
    .eq("id", imageId)
    .eq("product_id", productId)
    .select("id")
    .maybeSingle();

  if (error) return actionError(messageFromPostgresError(error));
  if (!data) return actionError("Görsel bulunamadı.");

  revalidatePath(`/admin/urunler/${productId}`);
  return actionSuccess("Ana görsel güncellendi.");
}

export async function moveImageAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireAdminAction();
  if (!guard.ok) return actionError(guard.message);

  const imageId = formData.get("imageId");
  const productId = formData.get("productId");
  const direction = formData.get("direction");

  if (typeof imageId !== "string" || typeof productId !== "string") {
    return actionError("Görsel seçilmedi.");
  }
  if (direction !== "up" && direction !== "down") {
    return actionError("Geçersiz yön.");
  }

  const supabase = await getServerClient();
  const { data: images, error } = await supabase
    .from("product_images")
    .select("id, display_order")
    .eq("product_id", productId)
    .order("display_order", { ascending: true });

  if (error) return actionError(messageFromPostgresError(error));
  if (!images || images.length < 2) return actionSuccess("Sıralama değişmedi.");

  const index = images.findIndex((image) => image.id === imageId);
  if (index === -1) return actionError("Görsel bulunamadı.");

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= images.length) {
    return actionSuccess("Sıralama değişmedi.");
  }

  // Sırayı baştan yaz: display_order değerleri çakışmış olsa bile düzelir.
  const reordered = [...images];
  [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];

  for (const [position, image] of reordered.entries()) {
    const { error: updateError } = await supabase
      .from("product_images")
      .update({ display_order: (position + 1) * 10 })
      .eq("id", image.id);
    if (updateError) return actionError(messageFromPostgresError(updateError));
  }

  revalidatePath(`/admin/urunler/${productId}`);
  return actionSuccess("Sıralama güncellendi.");
}

/**
 * Görseli KALICI olarak siler (dosya + satır).
 *
 * Kalıcı silme kuralı (bilgi dosyası §17): ana kayıtlar arşivlenir, silinmez.
 * Görsel ikincil bir kayıttır ve arşivlenmiş bir görselin anlamı yoktur; bu
 * yüzden gerçek DELETE kullanılır. Arayüz onay adımı ister.
 */
export async function deleteImageAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireAdminAction();
  if (!guard.ok) return actionError(guard.message);

  const imageId = formData.get("imageId");
  const productId = formData.get("productId");
  if (typeof imageId !== "string" || typeof productId !== "string") {
    return actionError("Görsel seçilmedi.");
  }

  const supabase = await getServerClient();

  const { data: image, error: readError } = await supabase
    .from("product_images")
    .select("id, storage_path, is_primary")
    .eq("id", imageId)
    .eq("product_id", productId)
    .maybeSingle();

  if (readError) return actionError(messageFromPostgresError(readError));
  if (!image) return actionError("Görsel bulunamadı.");

  // Önce satır silinir: dosya silinip satır kalsaydı arayüz kırık görsel
  // gösterirdi. Tersi durumda kovada yetim dosya kalır — daha zararsızdır.
  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId);
  if (deleteError) return actionError(messageFromPostgresError(deleteError));

  const { error: removeError } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .remove([image.storage_path]);

  // Dosya silinemese bile satır gitti; kullanıcıya işlem başarılı görünür ama
  // sunucu günlüğüne düşer ki fark edilebilsin.
  if (removeError) {
    console.error(
      `[storage] yetim dosya kaldı: ${image.storage_path} — ${removeError.message}`,
    );
  }

  // Silinen ana görselse, kalanlardan ilki ana görsel yapılır.
  if (image.is_primary) {
    const { data: remaining } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", productId)
      .order("display_order", { ascending: true })
      .limit(1);

    if (remaining && remaining.length > 0) {
      await supabase
        .from("product_images")
        .update({ is_primary: true })
        .eq("id", remaining[0].id);
    }
  }

  revalidatePath(`/admin/urunler/${productId}`);
  return actionSuccess("Görsel silindi.");
}
