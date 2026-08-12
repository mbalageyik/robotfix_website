/*
  Supabase ortam değişkenlerinin tek okuma noktası.

  `NEXT_PUBLIC_*` değerler tarayıcıya gömülür ve gömülmesi güvenlidir:
  anon anahtar RLS ile sınırlıdır. Service role anahtarı RLS'i ATLAR — bu
  yüzden ayrı bir dosyada (admin.ts) ve `server-only` koruması altında okunur.
*/

/** Yapılandırma eksikse atılır; sessizce yanlış veri döndürmeyiz. */
export class SupabaseConfigError extends Error {
  constructor(missing: string[]) {
    super(
      `Supabase yapılandırması eksik: ${missing.join(", ")}. ` +
        `.env.local dosyasını doldurun (bkz. docs/supabase-setup.md).`,
    );
    this.name = "SupabaseConfigError";
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Supabase yapılandırılmış mı.
 *
 * Faz 2'de veritabanı henüz kurulmamış olabilir. Bu bayrak sayesinde build
 * kırılmaz; veri fonksiyonları anlamlı bir "yapılandırılmamış" durumu döndürür
 * ve `/veri-kontrol` bunu açıkça gösterir.
 */
export const isSupabaseConfigured = url !== "" && anonKey !== "";

/** Doğrulanmış genel (anon) yapılandırma. Eksikse hata atar. */
export function getPublicSupabaseConfig(): { url: string; anonKey: string } {
  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (missing.length > 0) throw new SupabaseConfigError(missing);
  return { url, anonKey };
}

/**
 * Demo (`[ÖRNEK]`) satırlarının arayüzde gösterilip gösterilmeyeceği.
 *
 * Üretimde daima kapalıdır: `NEXT_PUBLIC_SHOW_DEMO_PRODUCTS` açıkça "true"
 * olsa bile `NODE_ENV === "production"` ise yok sayılır. Yanlış yapılandırma
 * yüzünden örnek verinin yayına çıkması bu sayede imkânsızdır.
 */
export const showDemoContent =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_SHOW_DEMO_PRODUCTS === "true";
