import { cn } from "@/lib/cn";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  SlashCircleIcon,
} from "@/components/ui/icons";

/*
  Bulunabilirlik rozeti.

  Bilgi dosyası §15: "Stokta, Siparişle, Sınırlı stok ve Tükendi durumları
  YALNIZCA RENK İLE ANLATILMAMALI; metin ve gerektiğinde simge de kullanılmalı."
  Bu yüzden metin zorunludur ve kaldırılamaz — bileşen yalnız-simge modu sunmaz.

  Durum renkleri marka vurgu renklerinden ayrı tutulur (yine §15).
*/

export type Availability = "in_stock" | "limited" | "backorder" | "out_of_stock";

const config: Record<
  Availability,
  { label: string; icon: typeof CheckCircleIcon; className: string }
> = {
  in_stock: {
    label: "Stokta",
    icon: CheckCircleIcon,
    className: "border-success/35 bg-success/10 text-success",
  },
  limited: {
    label: "Sınırlı stok",
    icon: AlertTriangleIcon,
    className: "border-warning/35 bg-warning/10 text-warning",
  },
  backorder: {
    label: "Siparişle",
    icon: ClockIcon,
    className: "border-info/35 bg-info/10 text-info",
  },
  out_of_stock: {
    label: "Tükendi",
    icon: SlashCircleIcon,
    className: "border-neutral/35 bg-neutral/10 text-neutral",
  },
};

export interface AvailabilityBadgeProps {
  status: Availability;
  /** Yerleşim sınıfları (renk/dolgu için varyant API'sini kullanın). */
  className?: string;
}

export function AvailabilityBadge({ status, className }: AvailabilityBadgeProps) {
  const { label, icon: StatusIcon, className: tone } = config[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-caption font-semibold",
        tone,
        className,
      )}
    >
      <StatusIcon className="size-4 shrink-0" />
      {label}
    </span>
  );
}

/** Metin karşılıkları — WhatsApp mesajı ve yapılandırılmış veride yeniden kullanılır. */
export const availabilityLabels: Record<Availability, string> = {
  in_stock: config.in_stock.label,
  limited: config.limited.label,
  backorder: config.backorder.label,
  out_of_stock: config.out_of_stock.label,
};
