import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/*
  Ana sayfa bölüm başlığı.

  Her bölüm `aria-labelledby` ile kendi başlığına bağlanır; bu yüzden `id`
  ZORUNLUDUR. Overline dekoratiftir ve başlığın yerine geçmez — ekran okuyucu
  için anlam taşıyan tek öğe `<h2>`dir.
*/

export interface SectionHeadingProps {
  /** `aria-labelledby` hedefi. */
  id: string;
  /** Küçük üst etiket; yalnız görsel ritim içindir. */
  overline?: string;
  title: string;
  /** Başlığın altındaki kısa açıklama. */
  description?: string;
  /** Başlık bloğunun sağına hizalanan bağlantı (ör. "Tümünü gör"). */
  action?: ReactNode;
  className?: string;
}

export function SectionHeading({
  id,
  overline,
  title,
  description,
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}
    >
      <div className="flex max-w-2xl flex-col gap-2">
        {overline && <p className="text-overline uppercase text-link">{overline}</p>}
        <h2 id={id} className="text-h2">
          {title}
        </h2>
        {description && <p className="text-body-lg text-text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
