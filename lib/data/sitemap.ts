import { getPublicClient } from "@/lib/supabase/public-client";
import { isSupabaseConfigured, showDemoContent } from "@/lib/supabase/env";
import { fail, ok, type DataResult } from "@/lib/data/result";

/*
  Sitemap girdileri.

  GÖRÜNÜRLÜK: burada da `status = 'active'` filtresi YAZILMAZ — kural
  `lib/data/products.ts` ile aynıdır, görünürlüğü RLS belirler. Anon istemci
  taslak satırı zaten GÖREMEZ; filtreyi buraya yazmak korumayı ikinci bir yere
  kopyalar ve o kopya unutulduğunda sessizce sızıntı üretirdi.

  DEMO SATIRLAR: `showDemoContent` üretimde daima kapalıdır (bkz.
  `lib/supabase/env.ts`), bu yüzden `is_demo` satırları sitemap'e giremez.
  Yerelde demo satırlar `dev_activate_demo.sql` ile aktifleştirildiğinde bile
  sitemap'in bunları listelememesi için filtre BURADA da uygulanır: sitemap
  arama motorlarına verilen bir vaattir, geliştirme kolaylığına feda edilmez.
*/

export interface SitemapEntry {
  slug: string;
  /** `updated_at` — sitemap'te `lastModified` olur. Yoksa alan hiç yazılmaz. */
  updatedAt: string | null;
}

/** Detay sayfası olan (yani herkese açık) ürünlerin slug'ları. */
export async function listProductSitemapEntries(): Promise<DataResult<SitemapEntry[]>> {
  if (!isSupabaseConfigured) {
    return fail("not_configured", "Supabase yapılandırılmamış.");
  }

  let query = getPublicClient()
    .from("products")
    .select("slug, updated_at")
    .order("updated_at", { ascending: false });

  // Demo satırlar sitemap'e HİÇBİR ortamda girmez (yukarıdaki gerekçe).
  query = query.eq("is_demo", false);

  const { data, error } = await query;

  if (error) return fail("query_failed", error.message, error.code);

  return ok(data.map((row) => ({ slug: row.slug, updatedAt: row.updated_at })));
}

/**
 * Demo içeriğin sitemap'e giremeyeceğinin okunabilir kanıtı.
 *
 * `showDemoContent` yalnız arayüz tarafını etkiler; sitemap ondan bağımsız
 * olarak demo satırları dışlar. `/veri-kontrol` bu değeri gösterir.
 */
export const SITEMAP_EXCLUDES_DEMO = true as const;

/** Arayüzde demo gösterimi açık mı — teşhis sayfası bunu sitemap'le karşılaştırır. */
export const uiShowsDemoContent = showDemoContent;
