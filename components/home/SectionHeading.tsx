import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/*
  Ana sayfa bölüm başlığı.

  Her bölüm `aria-labelledby` ile kendi başlığına bağlanır; bu yüzden `id`
  ZORUNLUDUR. Overline dekoratiftir ve başlığın yerine geçmez — ekran okuyucu
  için anlam taşıyan tek öğe `<h2>`dir.

  ---------------------------------------------------------------------------
  TİPOGRAFİK RİTİM (Faz 8) — başlık bloğunun üç satırı eşit aralıklı DEĞİLDİR
  ---------------------------------------------------------------------------
  Önceden üçü de `gap-2` (8px) ile diziliyordu ve blok tek bir metin yığını
  gibi okunuyordu. Üst etiket başlığın ETİKETİDİR, açıklama ise ondan AYRI
  bir cümledir; ikisi aynı mesafede duramaz.

    üst etiket → başlık : 8px  (bağlı — etiket başlığa aittir)
    başlık → açıklama   : 16px (ayrı — yeni bir düşünce başlar)

  İkisi de 8px ızgarasındadır. Ölçek büyütülmedi; yalnız aralık anlamına
  göre dağıtıldı.

  BAŞLIK ÖLÇEĞİ SAYFA BOYUNCA TEKTİR: her bölüm `text-h2` kullanır. Rol
  bazlı diğer kademeler `app/globals.css` içindeki tipografi rolleri
  notunda listelidir.
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
        {description && <p className="mt-2 text-body-lg text-text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
