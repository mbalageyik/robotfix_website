import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ExternalLinkIcon, SpinnerIcon } from "@/components/ui/icons";

/*
  Buton — sunucu bileşeni (istemci JS gerektirmez).

  Bilgi dosyası §15 kuralları:
  - Aynı öneme sahip eylemler aynı stili kullanır; ana CTA rengi bölümden
    bölüme değişmez → `primary` her yerde Güven Yeşili'dir.
  - Kırmızı ana eylem rengi DEĞİLDİR; buton varyantları arasında yoktur.
  - Pazaryeri butonlarında pazaryerinin adı açıkça görünür (yalnız renge veya
    logoya güvenilmez) → `marketplace` varyantı metni zorunlu kılar.
*/

export type ButtonVariant = "primary" | "whatsapp" | "secondary" | "ghost" | "marketplace";
export type ButtonSize = "sm" | "md" | "lg";

/*
  Dolu butonlar HER ZAMAN 1px kenarlık taşır. Açık zeminde bu kenarlık
  saydamdır (yüzey kontrastı zaten yeterli); koyu zeminde `.rf-on-dark`
  `--color-button-edge` tokenını görünür bir tona çevirir.

  Neden: marka kitabı §3.6.3 — Güven Yeşili yüzeyi Gece Laciverti üstünde
  2.67:1, WhatsApp yeşili 2.18:1. Metin okunuyor ama butonun KENARI zeminden
  ayrışmıyor; WCAG 1.4.11 bunu ihlal sayar.
*/
/*
  FAZ 8 — MİKRO-ETKİLEŞİM: dolu butonlar hover/odakta gölgeyi e1'den e2'ye
  derinleştirir. Renk değişimi zaten vardı; gölge onun üstüne "basılabilir"
  hissini ekler.

  BUTON KALKMAZ (`.rf-lift` YOK) — bilinçli. Butonlar çoğu yerde yan yana
  bir CTA satırındadır; birinin 2px yükselmesi komşusuyla taban hizasını
  gözle bozar. Kart bir yüzeydir ve tek başına durur, buton bir kontroldür
  ve sırasının içindedir. Bu yüzden geri bildirim burada yalnız DERİNLİK,
  kartta derinlik + kaldırmadır.

  Geçiş `transition-colors` değil `transition-[colors,box-shadow]` olmalıydı;
  Tailwind'de bunun karşılığı `transition` yerine iki özelliği de kapsayan
  `transition-[color,background-color,border-color,box-shadow]`. Süre ve eğri
  tokenlardan gelir, azaltılmış hareket global katmanda zaten kısar.
*/
const base =
  "inline-flex items-center justify-center gap-2 rounded-md border font-semibold " +
  "transition-[color,background-color,border-color,box-shadow] " +
  "duration-(--duration-fast) ease-(--ease-standard) " +
  "disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:cursor-not-allowed aria-disabled:opacity-55";

/** Dolu butonların ortak yükselti davranışı — tek yerde yazılır. */
const filledElevation = "shadow-(--shadow-e1) hover:shadow-(--shadow-e2)";

const variants: Record<ButtonVariant, string> = {
  primary: `border-button-edge bg-action text-action-fg hover:bg-action-hover ${filledElevation}`,
  whatsapp: `border-button-edge bg-action-whatsapp text-action-whatsapp-fg hover:bg-action-whatsapp-hover ${filledElevation}`,
  secondary: `border-button-edge bg-action-secondary text-action-secondary-fg hover:bg-action-secondary-hover ${filledElevation}`,
  /* Metin bağlantısı — yüzeyi yoktur, gölgesi de olmaz. */
  ghost:
    "border-transparent bg-transparent text-link underline underline-offset-4 decoration-1 hover:text-link-hover hover:decoration-2",
  marketplace: `border-border-strong bg-surface-raised text-text hover:border-link hover:text-link ${filledElevation}`,
};

const sizes: Record<ButtonSize, string> = {
  // min-h değerleri dokunma hedefi içindir (≥44px orta ve büyük boyutta).
  sm: "min-h-9 px-3 py-1.5 text-caption",
  md: "min-h-11 px-4 py-2.5 text-body",
  lg: "min-h-13 px-6 py-3 text-body-lg",
};

const iconSizes: Record<ButtonSize, string> = {
  sm: "size-4",
  md: "size-5",
  lg: "size-5",
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Butonun tamamının satır genişliğini kaplaması (mobil CTA'lar). */
  fullWidth?: boolean;
  children: ReactNode;
  className?: string;
}

function shell({ variant = "primary", size = "md", fullWidth, className }: CommonProps) {
  return cn(base, variants[variant], sizes[size], fullWidth && "w-full", className);
}

export interface ButtonProps
  extends CommonProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  /**
   * Yükleniyor durumu. Buton devre dışı kalır ve durum ekran okuyucuya
   * `aria-busy` + görünmez metinle bildirilir — yalnız simge dönmesi yetmez.
   */
  loading?: boolean;
  /** Yükleniyorken okunacak metin. */
  loadingLabel?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  loading = false,
  loadingLabel = "İşleniyor",
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={shell({ variant, size, fullWidth, className, children })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <SpinnerIcon className={cn(iconSizes[size], "animate-spin")} />}
      {loading ? <span className="sr-only">{loadingLabel}</span> : null}
      {children}
    </button>
  );
}

export interface ButtonLinkProps
  extends CommonProps, Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> {
  href: string;
  /**
   * Harici bağlantı: yeni sekmede `rel="noopener noreferrer"` ile açılır ve
   * "yeni sekmede açılır" bilgisi ekran okuyucuya iletilir.
   */
  external?: boolean;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  external = false,
  children,
  href,
  ...props
}: ButtonLinkProps) {
  const externalProps = external ? ({ target: "_blank", rel: "noopener noreferrer" } as const) : {};

  return (
    <a
      href={href}
      className={shell({ variant, size, fullWidth, className, children })}
      {...externalProps}
      {...props}
    >
      {children}
      {external && (
        <>
          <ExternalLinkIcon className={iconSizes[size]} />
          <span className="sr-only">(yeni sekmede açılır)</span>
        </>
      )}
    </a>
  );
}
