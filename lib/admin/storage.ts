/** Ürün görsellerinin durduğu Storage kovası. Migrasyonla aynı olmalı. */
export const PRODUCT_IMAGE_BUCKET = "product-images";

/** Dosya adından güvenli bir uzantı çıkarır. */
export function extensionForMimeType(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    default:
      return "bin";
  }
}

/**
 * Storage yolu üretir.
 *
 * Kullanıcının verdiği dosya adı KULLANILMAZ. Sebep: dosya adı saldırgan
 * girdisidir — yol geçişi (`../`), Unicode hileleri ve çok uzun adlar taşır.
 * Yol tamamen bizim ürettiğimiz değerlerden kurulur.
 */
export function buildImagePath(productId: string, mimeType: string): string {
  const unique = globalThis.crypto.randomUUID();
  return `products/${productId}/${unique}.${extensionForMimeType(mimeType)}`;
}

/** Kovadaki nesnenin herkese açık URL'i. */
export function publicImageUrl(supabaseUrl: string, storagePath: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${storagePath}`;
}
