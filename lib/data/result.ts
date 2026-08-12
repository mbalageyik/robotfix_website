/*
  Veri katmanının hata sözleşmesi.

  KURAL: hata SESSİZCE YUTULMAZ. Bir sorgu başarısız olursa boş dizi dönmeyiz —
  çağıran taraf "veri yok" ile "sorgu patladı"yı ayırt edebilmelidir. Aksi hâlde
  katalog sayfası, veritabanı çökmüşken "ürün bulunamadı" der ve hata görünmez
  kalır.

  Bu yüzden okuma fonksiyonları `DataResult` döner:
    - ok: true  → veri geldi (boş olabilir; bu meşru bir "sonuç yok" durumudur)
    - ok: false → sebebi belli bir hata
*/

export type DataErrorKind =
  /** Supabase env değerleri tanımsız — veritabanı henüz kurulmamış. */
  | "not_configured"
  /** Sorgu çalıştı ama veritabanı hata döndürdü. */
  | "query_failed"
  /** Kayıt bulunamadı (tek kayıt sorgularında). */
  | "not_found";

export interface DataError {
  kind: DataErrorKind;
  message: string;
  /** Supabase'in ham hata kodu, varsa. */
  code?: string;
}

export type DataResult<T> = { ok: true; data: T } | { ok: false; error: DataError };

export function ok<T>(data: T): DataResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(
  kind: DataErrorKind,
  message: string,
  code?: string,
): DataResult<T> {
  return { ok: false, error: { kind, message, code } };
}

/**
 * Başarısız sonuçta yedek değer döndürür.
 *
 * Hatayı GÖRÜNMEZ KILMAZ: `not_configured` dışındaki hatalar sunucu günlüğüne
 * yazılır. Yalnız sayfanın tamamını düşürmenin doğru olmadığı yerlerde
 * (ör. yan bölüm) kullanılmalıdır.
 */
export function unwrapOr<T>(result: DataResult<T>, fallback: T, context: string): T {
  if (result.ok) return result.data;
  if (result.error.kind !== "not_configured") {
    console.error(`[data] ${context} başarısız: ${result.error.message}`, result.error.code ?? "");
  }
  return fallback;
}
