import { publicImageUrl } from "@/lib/admin/storage";
import { getPublicSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/env";

/*
  Ürün görsellerinin herkese açık URL'i.

  Kova adı ve URL şablonu `lib/admin/storage.ts` içinde TEK KEZ tanımlıdır;
  burada yeniden yazılmaz. O dosya `server-only` değildir ve saf fonksiyon
  barındırır (yönetim paneli istemci bileşeni de aynı yardımcıyı kullanır) —
  "admin" adı yalnız tarihsel konumdur, güvenlik sınırı değildir.

  Supabase yapılandırılmamışsa `null` döner: kırık bir <img> yerine görselsiz
  yerleşim gösteririz.
*/
export function productImageUrl(storagePath: string): string | null {
  if (!isSupabaseConfigured) return null;
  return publicImageUrl(getPublicSupabaseConfig().url, storagePath);
}
