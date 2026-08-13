/*
  Aksiyon sonuç sözleşmesi.

  Formlar `useActionState` ile bu nesneyi alır. Alan bazlı hatalar `fieldErrors`
  içinde döner ki `Field` bileşeni doğru alanın altına yazabilsin.

  `lib/data/result.ts` (okuma) ile bilinçli olarak AYRIDIR: okuma sonucu veri
  taşır, yazma sonucu kullanıcıya gösterilecek mesaj taşır.
*/

export interface ActionState {
  status: "idle" | "success" | "error";
  /** Kullanıcıya gösterilecek genel mesaj. */
  message: string | null;
  /** Alan adı → hata mesajı. */
  fieldErrors: Record<string, string>;
}

export const IDLE_ACTION_STATE: ActionState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};

export function actionError(message: string, fieldErrors: Record<string, string> = {}): ActionState {
  return { status: "error", message, fieldErrors };
}

export function actionSuccess(message: string): ActionState {
  return { status: "success", message, fieldErrors: {} };
}

/** zod `flatten()` çıktısını alan bazlı haritaya çevirir. */
export function fieldErrorsFromZod(
  flattened: { fieldErrors: Record<string, string[] | undefined> },
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [field, messages] of Object.entries(flattened.fieldErrors)) {
    if (messages && messages.length > 0) result[field] = messages[0];
  }
  return result;
}

/**
 * Postgres hatalarını kullanıcıya anlaşılır mesaja çevirir.
 *
 * Ham veritabanı hatası gösterilmez: hem anlaşılmaz hem de şema ayrıntısı
 * (tablo/kısıt adları) sızdırır.
 */
export function messageFromPostgresError(
  error: { code?: string; message: string },
  context: { slugLabel?: string } = {},
): string {
  switch (error.code) {
    case "23505": {
      // unique_violation — hangi kısıt olduğunu mesajdan çıkarmaya çalışırız.
      if (error.message.includes("slug")) {
        return `Bu slug zaten kullanılıyor. ${context.slugLabel ?? "Farklı bir slug girin"}.`;
      }
      if (error.message.includes("sku")) {
        return "Bu ürün kodu (SKU) başka bir üründe kullanılıyor.";
      }
      if (error.message.includes("one_primary")) {
        return "Bir ürünün yalnız bir ana görseli olabilir.";
      }
      return "Bu kayıt zaten mevcut (benzersizlik ihlali).";
    }
    case "23503":
      return "Bağlı bir kayıt bulunamadı; seçiminizi kontrol edin.";
    case "23514":
      // check_violation — şema kısıtı. En sık fiyat ve indirim kuralları.
      if (error.message.includes("compare_at")) {
        return "Eski fiyat, güncel fiyattan büyük olmalıdır.";
      }
      if (error.message.includes("price_minor")) {
        return "Fiyat sıfırdan büyük olmalıdır (boş bırakmak serbesttir).";
      }
      return "Girilen değerler veritabanı kurallarına uymuyor.";
    case "42501":
      return "Bu işlem için yetkiniz yok.";
    default:
      return "İşlem tamamlanamadı. Lütfen tekrar deneyin.";
  }
}
