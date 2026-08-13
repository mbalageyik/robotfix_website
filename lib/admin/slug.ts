import "server-only";

import { getServerClient } from "@/lib/supabase/server-client";

/*
  Slug üretimi VERİTABANININ `slugify()` fonksiyonuyla yapılır.

  NEDEN TS'te yeniden yazmıyoruz: tohum verisi, olası ileri SQL taşımaları ve
  panel AYNI slug'ı üretmelidir. İki ayrı uygulama er geç ayrışır — özellikle
  Türkçe'de (`I → ı`, `İ → i`) bu ayrışma sessiz ve geri alınamaz olur, çünkü
  slug kalıcı bir URL'dir. Tek kaynak: supabase/migrations/..._foundation.sql

  Maliyet: bir ağ gidiş-dönüşü. Yalnız kaydetme anında çalışır; kabul edilebilir.
*/

/** Verilen metinden slug üretir. Başarısız olursa `null`. */
export async function generateSlug(input: string): Promise<string | null> {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const supabase = await getServerClient();
  const { data, error } = await supabase.rpc("slugify", { input: trimmed });

  if (error || typeof data !== "string" || data === "") return null;
  return data;
}

/**
 * Formdan gelen slug'ı çözer: elle girilmişse onu, boşsa addan üretileni verir.
 * Üretilemezse `null` döner ve çağıran taraf kullanıcıya sorar.
 */
export async function resolveSlug(
  explicitSlug: string | null,
  nameFallback: string,
): Promise<string | null> {
  if (explicitSlug) return explicitSlug;
  return generateSlug(nameFallback);
}
