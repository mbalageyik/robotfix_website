/*
  Aksiyon sonuç sözleşmesi.

  Formlar `useActionState` ile bu nesneyi alır. Alan bazlı hatalar `fieldErrors`
  içinde döner ki `Field` bileşeni doğru alanın altına yazabilsin.

  `lib/data/result.ts` (okuma) ile bilinçli olarak AYRIDIR: okuma sonucu veri
  taşır, yazma sonucu kullanıcıya gösterilecek mesaj taşır.
*/

export interface ActionState<TValues = unknown> {
  status: "idle" | "success" | "error";
  /** Kullanıcıya gösterilecek genel mesaj. */
  message: string | null;
  /** Alan adı → hata mesajı. */
  fieldErrors: Record<string, string>;
  /**
   * GÖNDERİLEN DEĞERLERİN GERİ DÖNÜŞÜ.
   *
   * React, `<form action={fn}>` ile yapılan her gönderimde formu OTOMATİK
   * SIFIRLAR (`requestFormReset` → `form.reset()`). Doğrulama hatasında
   * kullanıcının yazdığı her şey böylece silinir. Bunu engellemenin doğru yolu
   * doğrulamayı gevşetmek değil, sunucunun aldığı değerleri geri göndermesi ve
   * formun onları yeniden basmasıdır.
   *
   * `tarayıcı deposu KULLANILMAZ` — değer yalnız bu tur içinde taşınır.
   */
  values?: TValues;
}

export const IDLE_ACTION_STATE: ActionState<never> = {
  status: "idle",
  message: null,
  fieldErrors: {},
};

export function actionError<TValues = never>(
  message: string,
  fieldErrors: Record<string, string> = {},
  values?: TValues,
): ActionState<TValues> {
  return { status: "error", message, fieldErrors, values };
}

export function actionSuccess<TValues = never>(
  message: string,
  values?: TValues,
): ActionState<TValues> {
  return { status: "success", message, fieldErrors: {}, values };
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

/** Hiçbir alana bağlanamayan (form geneli) hataların anahtarı. */
export const FORM_ERROR_KEY = "_form";

/**
 * zod HATALARINI NOKTALI YOL ANAHTARLARINA çevirir: `specs.1.value` gibi.
 *
 * NEDEN `flatten()` DEĞİL: `z.flattenError()` yalnız BİRİNCİ SEVİYE anahtarı
 * korur. İç içe bir dizide (`specs[1].value`) hata `specs` altında toplanır ve
 * hangi satırın hangi alanının bozuk olduğu bilgisi KAYBOLUR — kullanıcıya
 * gösterilebilecek tek şey "alt bölümlerde hata var" cümlesi kalır.
 *
 * Yol tümüyle korunduğunda form her hatayı doğru satırın doğru alanına
 * yazabilir. Düz şemalarda çıktı `flatten()` ile aynıdır (yol tek parçadır),
 * bu yüzden desen her iki durumda da çalışır.
 *
 * Aynı alan için birden çok sorun varsa İLKİ kazanır: kullanıcıya aynı anda
 * iki çelişik talimat vermek düzeltmeyi zorlaştırır.
 */
export function fieldErrorsFromZodIssues(
  issues: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.length > 0 ? issue.path.map(String).join(".") : FORM_ERROR_KEY;
    if (result[key] === undefined) result[key] = issue.message;
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
