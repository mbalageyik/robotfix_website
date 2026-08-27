"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminAction } from "@/lib/auth/dal";
import { getServerClient } from "@/lib/supabase/server-client";
import {
  actionError,
  actionSuccess,
  messageFromPostgresError,
  type ActionState,
} from "@/lib/admin/action-result";

/*
  ============================================================================
  Robot Fix Seçkisi — ana sayfadaki öne çıkan ürünler
  ============================================================================

  Bu dosya YENİ BİR VERİ MODELİ GETİRMEZ. Tek kaynak hâlâ `products.is_featured`
  ve `products.display_order`; ürün formu da aynı iki sütunu yazar. Buradaki
  aksiyonların varlık sebebi tek ekrandan toplu yönetim — "seçki üyeliği" diye
  ayrı bir tablo yoktur ve olmamalıdır (iki kaynak = kaçınılmaz tutarsızlık).

  HER aksiyon `requireAdminAction()` ile BAŞLAR (CLAUDE.md): formun yalnız
  yetkili bir sayfada render edilmiş olması güvenlik sınırı değildir.

  ---------------------------------------------------------------------------
  `display_order` PAYLAŞILAN BİR ALANDIR — bilinçli ödünleşim
  ---------------------------------------------------------------------------

  Aynı sütun hem seçki sırasını hem katalogdaki elle sıralamayı belirler
  (`listProducts` varsayılan sıralaması). Dolayısıyla seçkide bir ürünü yukarı
  taşımak, o ürünün katalog sırasını da değiştirir.

  Bunu gizlemek yerine iki şey yapılır:
    1. Ekranda açıkça yazılır (bkz. FeaturedProductsManager).
    2. Yazma EN AZ MÜDAHALE ile yapılır: sıra numaraları seçkinin MEVCUT EN
       KÜÇÜK değerinden başlatılır, sıfırdan değil. Böylece seçki bloğu
       katalogda bulunduğu yerde kalır, yalnız kendi içinde yer değiştirir.

  Alternatif — seçkiye ayrı bir sıra sütunu eklemek — veri modelini
  değiştirmek olurdu ve bu görevin kapsamı dışındadır.
*/

/** Sıra numaraları arasındaki boşluk: aralara elle değer yazılabilsin diye. */
const ORDER_STEP = 10;

const featuredToggleSchema = z.object({
  productId: z.string().uuid("Ürün seçilmedi."),
  featured: z.enum(["true", "false"], { message: "Geçersiz işlem." }),
});

const moveSchema = z.object({
  productId: z.string().uuid("Ürün seçilmedi."),
  direction: z.enum(["up", "down"], { message: "Geçersiz yön." }),
});

/**
 * Seçki değişikliğinden etkilenen her yüzeyi tazeler.
 *
 * `/` BURADA ÖNEMLİDİR: ana sayfa zaman aşımıyla yeniden üretilir (revalidate
 * 5 dk). Tazelenmezse yönetici değişikliği yaptıktan sonra siteye bakar,
 * hiçbir şey görmez ve "çalışmıyor" sonucuna varır — bu ekranın çözmeye
 * çalıştığı güven sorununun aynısı.
 */
function revalidateFeaturedSurfaces(productId: string): void {
  revalidatePath("/");
  revalidatePath("/urunler");
  revalidatePath("/admin/secki");
  revalidatePath("/admin/urunler");
  revalidatePath(`/admin/urunler/${productId}`);
  revalidatePath("/veri-kontrol");
}

/** Seçkideki ürünleri ana sayfayla AYNI sırayla getirir. */
async function readFeaturedOrder(
  supabase: Awaited<ReturnType<typeof getServerClient>>,
): Promise<{ ok: true; rows: { id: string; display_order: number }[] } | { ok: false; message: string }> {
  const { data, error } = await supabase
    .from("products")
    .select("id, display_order, name")
    .eq("is_featured", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) return { ok: false, message: messageFromPostgresError(error) };
  return { ok: true, rows: (data ?? []).map((row) => ({ id: row.id, display_order: row.display_order })) };
}

/**
 * Ürünü seçkiye ekler veya seçkiden çıkarır.
 *
 * EKLERKEN ürün SONA yerleştirilir: yeni eklenen bir ürünün, yöneticinin özenle
 * dizdiği listenin başına atlaması beklenmedik olurdu. Bunun için sıra numarası
 * mevcut en büyüğün bir adım üstüne alınır — seçkide başka ürün yoksa hiç
 * dokunulmaz (ürünün kendi katalog sırası korunur).
 *
 * ÇIKARIRKEN sıra numarasına DOKUNULMAZ: çıkarma bir sıralama işlemi değildir
 * ve ürünün katalogdaki yerini oynatmak için bir sebep yoktur.
 */
export async function setProductFeaturedAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireAdminAction();
  if (!guard.ok) return actionError(guard.message);

  const parsed = featuredToggleSchema.safeParse({
    productId: formData.get("productId"),
    featured: formData.get("featured"),
  });
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Geçersiz istek.");

  const { productId } = parsed.data;
  const featured = parsed.data.featured === "true";

  const supabase = await getServerClient();

  const patch: { is_featured: boolean; display_order?: number } = { is_featured: featured };

  if (featured) {
    const current = await readFeaturedOrder(supabase);
    if (!current.ok) return actionError(current.message);

    const others = current.rows.filter((row) => row.id !== productId);
    if (others.length > 0) {
      const highest = Math.max(...others.map((row) => row.display_order));
      patch.display_order = highest + ORDER_STEP;
    }
  }

  const { data, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", productId)
    .select("id, name")
    .maybeSingle();

  if (error) return actionError(messageFromPostgresError(error));
  // RLS satırı gizlemiş olabilir; "yetkin yok" ile "yok" ayrımı yapılmaz.
  if (!data) return actionError("Ürün bulunamadı veya yetkiniz yok.");

  revalidateFeaturedSurfaces(productId);

  return actionSuccess(
    featured
      ? `"${data.name}" Robot Fix Seçkisi'ne eklendi.`
      : `"${data.name}" Robot Fix Seçkisi'nden çıkarıldı.`,
  );
}

/**
 * Seçkideki bir ürünü bir sıra yukarı/aşağı taşır.
 *
 * `ImageManager`'daki desenin aynısı — sürükle-bırak YOKTUR: klavye ve
 * dokunmatik desteği gerektiren, kırılgan bir etkileşimdir.
 *
 * YAZMA STRATEJİSİ: yalnız seçkideki satırlar, mevcut en küçük sıra
 * numarasından başlayarak yeniden numaralanır. Baştan (0'dan) numaralamak
 * seçki bloğunu katalogda bambaşka bir yere taşırdı.
 */
export async function moveFeaturedProductAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guard = await requireAdminAction();
  if (!guard.ok) return actionError(guard.message);

  const parsed = moveSchema.safeParse({
    productId: formData.get("productId"),
    direction: formData.get("direction"),
  });
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Geçersiz istek.");

  const { productId, direction } = parsed.data;

  const supabase = await getServerClient();
  const current = await readFeaturedOrder(supabase);
  if (!current.ok) return actionError(current.message);

  const rows = current.rows;
  if (rows.length < 2) return actionSuccess("Sıralama değişmedi.");

  const index = rows.findIndex((row) => row.id === productId);
  if (index === -1) return actionError("Ürün seçkide bulunamadı.");

  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= rows.length) return actionSuccess("Sıralama değişmedi.");

  const reordered = [...rows];
  [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];

  /*
    Sıra baştan yazılır. Numaralar eşit olsa bile (varsayılan 0) sonuç kesin
    olur — yalnız iki satırın değerini takas etmek, ikisi de 0 olduğunda
    hiçbir şey yapmazdı ve buton bozukmuş gibi görünürdü.
  */
  const base = Math.min(...rows.map((row) => row.display_order));

  for (const [position, row] of reordered.entries()) {
    const nextOrder = base + position * ORDER_STEP;
    if (nextOrder === row.display_order) continue; // gereksiz yazma yok

    const { error } = await supabase
      .from("products")
      .update({ display_order: nextOrder })
      .eq("id", row.id);
    if (error) return actionError(messageFromPostgresError(error));
  }

  revalidateFeaturedSurfaces(productId);
  return actionSuccess("Seçki sıralaması güncellendi.");
}
