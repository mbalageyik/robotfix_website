import { cn } from "@/lib/cn";

/*
  Fiyat gösterimi.

  Bilgi dosyası §6 kuralları:
  - "Doğrulanmamış fiyat yayımlanmaz."
  - "Fiyat bilinmiyorsa ... 'Fiyat için iletişime geçin' seçeneği kullanılabilir."
  - "İndirim ve eski fiyat gösterimleri gerçek ve güncel verilere dayanmalıdır."
  - "...yanıltıcı büyüklük veya renk baskısı kullanılmamalıdır."

  Bu yüzden: fiyat yoksa 0, "—" veya boş dize DEĞİL, açık bir iletişim çağrısı
  gösterilir. İndirim rozeti abartılı renk/boyut kullanmaz.
*/

/** Fiyat metni kaynağı — WhatsApp mesajı da bunu kullanır ki gösterilen ile gönderilen aynı olsun. */
export function formatPrice(amount: number, currency = "TRY", locale = "tr-TR"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Fiyatı yoksa `null` döner — çağıran taraf "Fiyat için iletişime geçin" gösterir. */
export function formatPriceOrNull(
  amount: number | null | undefined,
  currency = "TRY",
): string | null {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) return null;
  return formatPrice(amount, currency);
}

export const PRICE_ON_REQUEST_LABEL = "Fiyat için iletişime geçin";

export interface PriceProps {
  /** Güncel fiyat. `null`/`undefined` → "Fiyat için iletişime geçin". */
  amount?: number | null;
  /** İndirim öncesi fiyat. Yalnız güncel fiyattan BÜYÜKSE gösterilir. */
  compareAtAmount?: number | null;
  currency?: string;
  size?: "md" | "lg";
  className?: string;
}

export function Price({
  amount,
  compareAtAmount,
  currency = "TRY",
  size = "md",
  className,
}: PriceProps) {
  const current = formatPriceOrNull(amount, currency);

  if (!current) {
    return (
      <p className={cn("text-body font-semibold text-link", className)}>{PRICE_ON_REQUEST_LABEL}</p>
    );
  }

  const previous =
    typeof compareAtAmount === "number" && typeof amount === "number" && compareAtAmount > amount
      ? formatPriceOrNull(compareAtAmount, currency)
      : null;

  const discountPercent = previous
    ? Math.round(((compareAtAmount! - amount!) / compareAtAmount!) * 100)
    : null;

  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      {/* tabular-nums: fiyat listesi hizalanmazsa güven düşer (marka kitabı §4.4). */}
      <span
        className={cn(
          "font-semibold tabular-nums text-text",
          size === "lg" ? "text-h3" : "text-body-lg",
        )}
      >
        <span className="sr-only">{previous ? "İndirimli fiyat: " : "Fiyat: "}</span>
        {current}
      </span>

      {previous && (
        <>
          <s className="text-caption tabular-nums text-text-muted">
            <span className="sr-only">Eski fiyat: </span>
            {previous}
          </s>
          {discountPercent !== null && discountPercent > 0 && (
            <span className="rounded-sm border border-success/35 bg-success/10 px-1.5 py-0.5 text-caption font-semibold text-success">
              %{discountPercent} indirim
            </span>
          )}
        </>
      )}
    </p>
  );
}
